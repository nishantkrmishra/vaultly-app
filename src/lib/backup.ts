/**
 * backup.ts — Vault export / import in .vaultly format.
 * The file is plain JSON containing:
 *  - already-encrypted items (ciphertext never decrypted during export)
 *  - vault_meta salts + authHash (so the file is self-contained)
 * Only the password holder can decrypt the contents.
 */

import { getMeta, getAllItems, replaceAllItems, saveMeta, resetVault, type EncryptedItemRecord, type VaultMetaRecord } from "./storage";

export interface VaultlyBackup {
  version: 1;
  app: "vaultly";
  created_at: number;
  meta: Pick<VaultMetaRecord, "authHash" | "authSalt" | "keySalt">;
  items: EncryptedItemRecord[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Create a .vaultly backup file and trigger browser download */
export async function exportVault(): Promise<void> {
  const meta = await getMeta();
  if (!meta) throw new Error("No vault meta found — is the vault registered?");
  const items = await getAllItems();

  const backup: VaultlyBackup = {
    version: 1,
    app: "vaultly",
    created_at: Date.now(),
    meta: {
      authHash: meta.authHash,
      authSalt: meta.authSalt,
      keySalt:  meta.keySalt,
    },
    items,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `vaultly-backup-${date}.vaultly`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

/** Validate and parse a .vaultly file from a File object */
export async function parseBackupFile(file: File): Promise<VaultlyBackup> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid file — not valid JSON");
  }

  const b = parsed as Partial<VaultlyBackup>;
  if (b.version !== 1 || b.app !== "vaultly") {
    throw new Error("Invalid file — not a Vaultly backup");
  }
  if (!b.meta?.authHash || !b.meta?.authSalt || !b.meta?.keySalt) {
    throw new Error("Backup is missing required metadata");
  }
  if (!Array.isArray(b.items)) {
    throw new Error("Backup is missing item data");
  }
  return b as VaultlyBackup;
}

/**
 * Import a backup, replacing ALL current vault data.
 * This does NOT decrypt items — it just replaces the raw encrypted blobs
 * and vault_meta. After import the user must log in with the backup's password.
 */
export async function importVault(backup: VaultlyBackup): Promise<void> {
  await resetVault();
  await saveMeta({
    id: "meta",
    version: 1,
    created_at: Date.now(),
    authHash: backup.meta.authHash,
    authSalt: backup.meta.authSalt,
    keySalt:  backup.meta.keySalt,
  });
  await replaceAllItems(backup.items);
}
