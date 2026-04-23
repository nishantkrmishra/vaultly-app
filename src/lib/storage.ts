/**
 * storage.ts — IndexedDB persistence layer.
 *
 * Stores:
 *   vault_meta   — version, dual salts, auth hash, optional KEK wraps for recovery
 *   vault_items  — AES-256-GCM encrypted vault items
 */

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME    = "vaultly_db";
const DB_VERSION = 3; // v3: adds masterKeyWrap + recoveryKeyWrap for KEK support

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface VaultMetaRecord {
  id: "meta";
  version: number;
  created_at: number;
  authHash: string;          // PBKDF2(password, authSalt) — for login verification
  authSalt: string;          // hex salt for auth hash
  keySalt: string;           // hex salt for encryption key derivation
  // ── KEK (Key Encryption Key) fields ──────────────────────────────────────
  masterKeyWrap?: string;    // base64: canary encrypted with PBKDF2(password, masterKekSalt)
  masterKekSalt?: string;    // hex salt for masterKeyWrap KDF
  recoveryKeyWrap?: string;  // base64: canary encrypted with PBKDF2(recoveryKey, recoverySalt)
  recoveryKekSalt?: string;  // hex salt for recoveryKeyWrap KDF
  // ── Recovery key metadata (no key stored — metadata only) ────────────────
  recoveryKeyGeneratedAt?: number;   // unix ms when recovery key was last generated
  recoveryConfirmed?: boolean;       // user confirmed they saved the key
}

export interface EncryptedItemRecord {
  id: string;
  type: string;        // "password" | "note" | "card" | "totp"
  title: string;       // plaintext — safe for list display
  iv: string;          // base64 AES-GCM IV
  ciphertext: string;  // base64 encrypted sensitive fields
  created_at: number;
  updated_at: number;
}

type VaultDB = {
  vault_meta: { key: string; value: VaultMetaRecord };
  vault_items: {
    key: string;
    value: EncryptedItemRecord;
    indexes: { by_type: string };
  };
};

// ─── DB init ─────────────────────────────────────────────────────────────────

let db: IDBPDatabase<VaultDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<VaultDB>> {
  if (db) return db;
  db = await openDB<VaultDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // v0 → fresh install
      if (oldVersion < 1) {
        database.createObjectStore("vault_meta", { keyPath: "id" });
        const store = database.createObjectStore("vault_items", { keyPath: "id" });
        store.createIndex("by_type", "type");
      }
      // v1 → v2: recreate vault_items with updated schema (type/created_at/updated_at)
      if (oldVersion === 1) {
        if (database.objectStoreNames.contains("vault_items")) {
          database.deleteObjectStore("vault_items");
        }
        const store = database.createObjectStore("vault_items", { keyPath: "id" });
        store.createIndex("by_type", "type");
      }
      // v2 → v3: no structural change; new optional KEK fields in vault_meta are additive
    },
  });
  return db;
}

// ─── Vault Meta ──────────────────────────────────────────────────────────────

export async function getMeta(): Promise<VaultMetaRecord | undefined> {
  const d = await initDB();
  return d.get("vault_meta", "meta");
}

export async function saveMeta(meta: VaultMetaRecord): Promise<void> {
  const d = await initDB();
  await d.put("vault_meta", meta);
}

export async function deleteMeta(): Promise<void> {
  const d = await initDB();
  await d.delete("vault_meta", "meta");
}

// ─── Vault Items ─────────────────────────────────────────────────────────────

export async function getAllItems(): Promise<EncryptedItemRecord[]> {
  const d = await initDB();
  return d.getAll("vault_items");
}

export async function saveItem(item: EncryptedItemRecord): Promise<void> {
  const d = await initDB();
  await d.put("vault_items", item);
}

export async function deleteItem(id: string): Promise<void> {
  const d = await initDB();
  await d.delete("vault_items", id);
}

export async function clearAllItems(): Promise<void> {
  const d = await initDB();
  await d.clear("vault_items");
}

/** Atomic bulk-replace — used during master password re-encryption */
export async function replaceAllItems(items: EncryptedItemRecord[]): Promise<void> {
  const d  = await initDB();
  const tx = d.transaction("vault_items", "readwrite");
  await tx.store.clear();
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

/** Wipe everything — used for vault reset */
export async function resetVault(): Promise<void> {
  const d = await initDB();
  await d.clear("vault_meta");
  await d.clear("vault_items");
}
