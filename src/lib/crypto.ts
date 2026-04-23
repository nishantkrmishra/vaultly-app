/**
 * crypto.ts — AES-256-GCM encryption + PBKDF2 key derivation
 * Uses only the Web Crypto API (no external dependencies).
 */

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;

// ─── Utilities ────────────────────────────────────────────────────────────────

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function generateSalt(bytes = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(bytes));
}

export function saltToHex(salt: Uint8Array): string {
  return bufToHex(salt.buffer);
}

export function hexToSalt(hex: string): Uint8Array {
  return hexToBuf(hex);
}

/**
 * Generate a random 128-bit recovery key as a hex string.
 * This is shown ONCE to the user and never stored.
 * Format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX (4 × 8 hex chars)
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex   = bufToHex(bytes.buffer);
  return [hex.slice(0, 8), hex.slice(8, 16), hex.slice(16, 24), hex.slice(24, 32)]
    .join("-")
    .toUpperCase();
}

// ─── Key Derivation ───────────────────────────────────────────────────────────

async function importPasswordKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
    "deriveKey",
  ]);
}

/**
 * Derive a raw AES-256 key from a password + salt via PBKDF2.
 * The key can be used for AES-GCM encryption/decryption.
 */
export async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await importPasswordKey(password);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a fixed-length hash (hex) from password + salt for auth verification.
 * We use PBKDF2 → deriveBits, then hex-encode.
 */
export async function deriveAuthHash(
  password: string,
  salt: Uint8Array
): Promise<string> {
  const baseKey = await importPasswordKey(password);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return bufToHex(bits);
}

// ─── AES-256-GCM Encrypt / Decrypt ───────────────────────────────────────────

export interface EncryptedBlob {
  iv: string; // base64
  ciphertext: string; // base64
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns base64-encoded IV + ciphertext.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  return {
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
  };
}

/**
 * Decrypt an AES-256-GCM blob back to plaintext string.
 */
export async function decrypt(
  blob: EncryptedBlob,
  key: CryptoKey
): Promise<string> {
  const iv = base64ToBuf(blob.iv);
  const ciphertext = base64ToBuf(blob.ciphertext);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
