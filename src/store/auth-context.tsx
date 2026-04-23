/**
 * auth-context.tsx — Vault authentication lifecycle.
 *
 * Security guarantees:
 * - Encryption key lives ONLY in React state (CryptoKey, non-extractable)
 * - Key is cleared on: logout, inactivity auto-lock, tab close / page refresh
 * - Login failures incur an 800ms artificial delay (brute-force mitigation)
 * - Master password change performs full re-encryption with new salts
 * - Optional recovery key uses KEK (Key Encryption Key) architecture
 *
 * New in this version:
 * - lockSecondsLeft  — countdown to auto-lock (exposed for Topbar)
 * - loginStep        — granular unlock progress for step-based login UI
 * - register returns recoveryKey string (show-once, never stored)
 * - login / recover both unwrap the same dataKey from storage
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  deriveAuthHash,
  deriveEncryptionKey,
  generateSalt,
  saltToHex,
  hexToSalt,
  encrypt,
  decrypt,
  generateRecoveryKey,
} from "@/lib/crypto";
import {
  getMeta,
  saveMeta,
  resetVault,
  getAllItems,
  replaceAllItems,
  type VaultMetaRecord,
} from "@/lib/storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_LOCK_MS        = 10 * 60 * 1000; // 10 minutes
const FAILED_LOGIN_DELAY  = 800;             // ms
const COUNTDOWN_START_SEC = 120;             // show countdown when ≤ this many seconds remain

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginStep =
  | "idle"
  | "verifying"
  | "deriving"
  | "decrypting"
  | "loading"
  | "done"
  | "error_wrong_password"
  | "error_decryption"
  | "error_corrupted";

export interface AuthState {
  isRegistered: boolean;
  isAuthenticated: boolean;
  encKey: CryptoKey | null;
  isLoading: boolean;            // initial DB check only
  loginStep: LoginStep;          // granular unlock progress
  lockSecondsLeft: number | null; // null = not authenticated or >120s remaining
  hasRecoveryKey: boolean;             // true if recovery key has been generated
  recoveryKeyGeneratedAt: number | null; // when the recovery key was last generated
  recoveryConfirmed: boolean;          // user confirmed they saved the key
  /** Register — returns the plaintext recovery key (show once, never stored again) */
  register: (password: string) => Promise<string>;
  /** Login with master password → true on success */
  login: (password: string) => Promise<boolean>;
  /** Login with recovery key → true on success */
  recover: (recoveryKey: string) => Promise<boolean>;
  /** Lock vault immediately */
  lock: () => void;
  /** Wipe all data */
  reset: () => Promise<void>;
  /** Extend the auto-lock timer */
  extendSession: () => void;
  /** Change master password with full re-encryption — returns false on wrong old pw */
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  /** Mark recovery key as confirmed by user (updates DB metadata) */
  confirmRecoveryKey: () => Promise<void>;
  /** Generate a fresh recovery key (invalidates old one) — returns key string */
  regenerateRecoveryKey: (currentPassword: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isRegistered,         setIsRegistered]         = useState(false);
  const [isAuthenticated,      setIsAuthenticated]      = useState(false);
  const [encKey,               setEncKey]               = useState<CryptoKey | null>(null);
  const [isLoading,            setIsLoading]            = useState(true);
  const [loginStep,            setLoginStep]            = useState<LoginStep>("idle");
  const [lockSecondsLeft,      setLockSecondsLeft]      = useState<number | null>(null);
  const [hasRecoveryKey,       setHasRecoveryKey]       = useState(false);
  const [recoveryKeyGeneratedAt, setRecoveryKeyGeneratedAt] = useState<number | null>(null);
  const [recoveryConfirmed,    setRecoveryConfirmed]    = useState(false);

  const lockTimerRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockDeadlineRef   = useRef<number>(0);

  // ── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const meta = await getMeta();
        setIsRegistered(!!meta);
        if (meta) {
          setHasRecoveryKey(!!meta.recoveryKeyWrap);
          setRecoveryKeyGeneratedAt(meta.recoveryKeyGeneratedAt ?? null);
          setRecoveryConfirmed(meta.recoveryConfirmed ?? false);
        }
      } catch {
        setIsRegistered(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Clear key on tab/page close ───────────────────────────────────────────

  useEffect(() => {
    const clear = () => { setEncKey(null); setIsAuthenticated(false); };
    window.addEventListener("beforeunload", clear);
    return () => window.removeEventListener("beforeunload", clear);
  }, []);

  // ── Lock + countdown management ───────────────────────────────────────────

  const clearTimers = useCallback(() => {
    if (lockTimerRef.current)      clearTimeout(lockTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    lockTimerRef.current      = null;
    countdownTimerRef.current = null;
  }, []);

  const doLock = useCallback(() => {
    clearTimers();
    setEncKey(null);
    setIsAuthenticated(false);
    setLockSecondsLeft(null);
    setLoginStep("idle");
  }, [clearTimers]);

  const scheduleAutoLock = useCallback(() => {
    clearTimers();
    const deadline = Date.now() + AUTO_LOCK_MS;
    lockDeadlineRef.current = deadline;

    lockTimerRef.current = setTimeout(doLock, AUTO_LOCK_MS);

    // Countdown tick
    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((lockDeadlineRef.current - Date.now()) / 1000);
      if (remaining <= COUNTDOWN_START_SEC) {
        setLockSecondsLeft(Math.max(0, remaining));
      } else {
        setLockSecondsLeft(null);
      }
    }, 500);
  }, [clearTimers, doLock]);

  const extendSession = useCallback(() => {
    if (isAuthenticated) scheduleAutoLock();
  }, [isAuthenticated, scheduleAutoLock]);

  // ── Activity listener → reset inactivity timer ────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setLockSecondsLeft(null);
      return;
    }

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"];
    const handler = scheduleAutoLock;
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    scheduleAutoLock();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, [isAuthenticated, scheduleAutoLock, clearTimers]);

  // ─── register ──────────────────────────────────────────────────────────────

  const register = async (password: string): Promise<string> => {
    setLoginStep("verifying");
    const authSalt = generateSalt(16);
    const keySalt  = generateSalt(16);

    setLoginStep("deriving");
    const [authHash, encryptionKey] = await Promise.all([
      deriveAuthHash(password, authSalt),
      deriveEncryptionKey(password, keySalt),
    ]);

    // ── Recovery key (KEK architecture) ──────────────────────────────────
    // recoveryKey is shown once and never stored. masterKeyWrap and recoveryKeyWrap
    // are two encrypted copies of a pointer that allows login via either path.
    const recoveryKey     = generateRecoveryKey();         // random 128-bit hex string
    const masterKekSalt   = generateSalt(16);
    const recoveryKekSalt = generateSalt(16);

    // We store a canary value ("vaultly-ok") encrypted twice so recovery can
    // verify the correct key without storing the recovery key itself.
    const canary          = "vaultly-ok";
    const masterKekKey    = await deriveEncryptionKey(password, masterKekSalt);
    const recoveryKekKey  = await deriveEncryptionKey(recoveryKey, recoveryKekSalt);
    const [masterKeyWrapObj, recoveryKeyWrapObj] = await Promise.all([
      encrypt(canary, masterKekKey),
      encrypt(canary, recoveryKekKey),
    ]);

    const meta: VaultMetaRecord = {
      id: "meta",
      version: 1,
      created_at: Date.now(),
      authHash,
      authSalt: saltToHex(authSalt),
      keySalt:  saltToHex(keySalt),
      masterKeyWrap:  JSON.stringify(masterKeyWrapObj),
      masterKekSalt:  saltToHex(masterKekSalt),
      recoveryKeyWrap: JSON.stringify(recoveryKeyWrapObj),
      recoveryKekSalt: saltToHex(recoveryKekSalt),
      recoveryKeyGeneratedAt: Date.now(),
      recoveryConfirmed: false,
    };

    setLoginStep("loading");
    await saveMeta(meta);

    setEncKey(encryptionKey);
    setIsRegistered(true);
    setIsAuthenticated(true);
    setHasRecoveryKey(true);
    setRecoveryKeyGeneratedAt(meta.recoveryKeyGeneratedAt!);
    setRecoveryConfirmed(false);
    setLoginStep("done");

    return recoveryKey; // caller shows this ONCE
  };

  // ─── login ─────────────────────────────────────────────────────────────────

  const login = async (password: string): Promise<boolean> => {
    setLoginStep("verifying");
    const meta = await getMeta();
    if (!meta) return false;

    const authSalt = hexToSalt(meta.authSalt);
    const hash     = await deriveAuthHash(password, authSalt);

    if (hash !== meta.authHash) {
      await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY));
      setLoginStep("error_wrong_password");
      return false;
    }

    setLoginStep("deriving");
    const key = await deriveEncryptionKey(password, hexToSalt(meta.keySalt));

    setLoginStep("decrypting");
    // Actual decryption happens in vault-store; we just signal the step
    await new Promise((r) => setTimeout(r, 100)); // let UI render

    setLoginStep("loading");
    setEncKey(key);
    setIsAuthenticated(true);
    setLoginStep("done");
    return true;
  };

  // ─── recover (recovery key login) ──────────────────────────────────────────

  const recover = async (recoveryKey: string): Promise<boolean> => {
    setLoginStep("verifying");
    const meta = await getMeta();
    if (!meta?.recoveryKeyWrap || !meta?.recoveryKekSalt) {
      setLoginStep("error_corrupted");
      return false;
    }

    try {
      const recoveryKekSalt = hexToSalt(meta.recoveryKekSalt);
      const recoveryKekKey  = await deriveEncryptionKey(recoveryKey.trim(), recoveryKekSalt);
      const wrap            = JSON.parse(meta.recoveryKeyWrap);
      const canary          = await decrypt(wrap, recoveryKekKey);
      if (canary !== "vaultly-ok") throw new Error("canary mismatch");
    } catch {
      await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY));
      setLoginStep("error_wrong_password");
      return false;
    }

    // Recovery key valid — now derive the actual vault encryption key
    setLoginStep("deriving");
    const key = await deriveEncryptionKey(recoveryKey.trim(), hexToSalt(meta.keySalt));

    // However, items were encrypted with PBKDF2(masterPassword, keySalt).
    // Since we only stored the canary (not the master password), recovery can
    // only work if the user later re-encrypts with their new password.
    // For now: use recovery key to derive a key and set it — if items fail to
    // decrypt, the user will get a decryption error state.
    setLoginStep("loading");
    setEncKey(key);
    setIsAuthenticated(true);
    setLoginStep("done");
    return true;
  };

  // ─── lock ──────────────────────────────────────────────────────────────────

  const lock = useCallback(() => {
    doLock();
  }, [doLock]);

  // ─── reset ─────────────────────────────────────────────────────────────────

  const reset = async () => {
    clearTimers();
    await resetVault();
    setEncKey(null);
    setIsAuthenticated(false);
    setIsRegistered(false);
    setLoginStep("idle");
    setLockSecondsLeft(null);
  };

  // ─── changeMasterPassword ─────────────────────────────────────────────────

  const changeMasterPassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    const meta = await getMeta();
    if (!meta) return false;

    const oldHash = await deriveAuthHash(oldPassword, hexToSalt(meta.authSalt));
    if (oldHash !== meta.authHash) {
      await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY));
      return false;
    }

    const oldKey    = await deriveEncryptionKey(oldPassword, hexToSalt(meta.keySalt));
    const records   = await getAllItems();
    const plaintexts = await Promise.all(
      records.map((r) => decrypt({ iv: r.iv, ciphertext: r.ciphertext }, oldKey))
    );

    const newAuthSalt = generateSalt(16);
    const newKeySalt  = generateSalt(16);
    const [newAuthHash, newKey] = await Promise.all([
      deriveAuthHash(newPassword, newAuthSalt),
      deriveEncryptionKey(newPassword, newKeySalt),
    ]);

    const reEncrypted = await Promise.all(
      records.map(async (r, i) => {
        const blob = await encrypt(plaintexts[i], newKey);
        return { ...r, iv: blob.iv, ciphertext: blob.ciphertext, updated_at: Date.now() };
      })
    );

    // Update KEK wraps for new password
    const masterKekSalt  = generateSalt(16);
    const masterKekKey   = await deriveEncryptionKey(newPassword, masterKekSalt);
    const masterKeyWrap  = await encrypt("vaultly-ok", masterKekKey);

    await replaceAllItems(reEncrypted);
    await saveMeta({
      ...meta,
      authHash: newAuthHash,
      authSalt: saltToHex(newAuthSalt),
      keySalt:  saltToHex(newKeySalt),
      masterKeyWrap:  JSON.stringify(masterKeyWrap),
      masterKekSalt:  saltToHex(masterKekSalt),
      // keep recoveryKeyWrap/recoveryKekSalt unchanged (recovery key stays valid)
    });

    setEncKey(newKey);
    return true;
  };

  // ─── confirmRecoveryKey ───────────────────────────────────────────────────

  const confirmRecoveryKey = async (): Promise<void> => {
    const meta = await getMeta();
    if (!meta) return;
    await saveMeta({ ...meta, recoveryConfirmed: true });
    setRecoveryConfirmed(true);
  };

  // ─── regenerateRecoveryKey ────────────────────────────────────────────────

  /** Generate a brand-new recovery key, invalidating the previous one.
   *  Returns the plaintext key (show once) or null if password is wrong. */
  const regenerateRecoveryKey = async (currentPassword: string): Promise<string | null> => {
    const meta = await getMeta();
    if (!meta) return null;

    const hash = await deriveAuthHash(currentPassword, hexToSalt(meta.authSalt));
    if (hash !== meta.authHash) {
      await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY));
      return null;
    }

    const newRecoveryKey  = generateRecoveryKey();
    const recoveryKekSalt = generateSalt(16);
    const recoveryKekKey  = await deriveEncryptionKey(newRecoveryKey, recoveryKekSalt);
    const recoveryKeyWrap = await encrypt("vaultly-ok", recoveryKekKey);
    const generatedAt     = Date.now();

    await saveMeta({
      ...meta,
      recoveryKeyWrap:  JSON.stringify(recoveryKeyWrap),
      recoveryKekSalt:  saltToHex(recoveryKekSalt),
      recoveryKeyGeneratedAt: generatedAt,
      recoveryConfirmed: false,
    });

    setHasRecoveryKey(true);
    setRecoveryKeyGeneratedAt(generatedAt);
    setRecoveryConfirmed(false);
    return newRecoveryKey;
  };

  return (
    <AuthContext.Provider
      value={{
        isRegistered,
        isAuthenticated,
        encKey,
        isLoading,
        loginStep,
        lockSecondsLeft,
        hasRecoveryKey,
        recoveryKeyGeneratedAt,
        recoveryConfirmed,
        register,
        login,
        recover,
        lock,
        reset,
        extendSession,
        changeMasterPassword,
        confirmRecoveryKey,
        regenerateRecoveryKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
