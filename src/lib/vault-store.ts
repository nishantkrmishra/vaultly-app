/**
 * vault-store.ts — Encrypted vault state management.
 * All IndexedDB writes are awaited and wrapped in try/catch.
 * Save status is exposed per-operation for UI feedback.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { VaultItem } from "./vault-types";
import { categoryColors, categoryEmojis } from "./vault-types";
import { encrypt, decrypt, type EncryptedBlob } from "./crypto";
import {
  getAllItems,
  saveItem,
  deleteItem,
  type EncryptedItemRecord,
} from "./storage";
import { toast } from "sonner";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SensitiveFields {
  username?: string;
  password?: string;
  url?: string;
  totp?: string;
  notes?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardHolder?: string;
  customIconUrl?: string;
  emoji?: string;
  bgColor?: string;
  passwordHistory?: Array<{ password: string; changedAt: number }>;
}

async function encryptItem(item: VaultItem, key: CryptoKey): Promise<EncryptedItemRecord> {
  const sensitive: SensitiveFields = {
    username: item.username, password: item.password, url: item.url,
    totp: item.totp, notes: item.notes, cardNumber: item.cardNumber,
    cardExpiry: item.cardExpiry, cardHolder: item.cardHolder,
    customIconUrl: item.customIconUrl, emoji: item.emoji, bgColor: item.bgColor,
    passwordHistory: item.passwordHistory,
  };
  const blob: EncryptedBlob = await encrypt(JSON.stringify(sensitive), key);
  return {
    id: item.id, type: item.category, title: item.title,
    iv: blob.iv, ciphertext: blob.ciphertext,
    created_at: item.createdAt, updated_at: Date.now(),
  };
}

async function decryptItem(record: EncryptedItemRecord, key: CryptoKey): Promise<VaultItem> {
  const plaintext  = await decrypt({ iv: record.iv, ciphertext: record.ciphertext }, key);
  const sensitive: SensitiveFields = JSON.parse(plaintext);
  const cat = record.type as VaultItem["category"];
  return {
    id: record.id, category: cat, title: record.title,
    username: sensitive.username, password: sensitive.password,
    url: sensitive.url, totp: sensitive.totp, notes: sensitive.notes,
    cardNumber: sensitive.cardNumber, cardExpiry: sensitive.cardExpiry,
    cardHolder: sensitive.cardHolder, customIconUrl: sensitive.customIconUrl,
    emoji: sensitive.emoji ?? categoryEmojis[cat],
    bgColor: sensitive.bgColor ?? categoryColors[cat],
    passwordHistory: sensitive.passwordHistory,
    createdAt: record.created_at,
  };
}

// ─── Global state ─────────────────────────────────────────────────────────────

let listeners: Array<(items: VaultItem[]) => void> = [];
let state: VaultItem[] = [];
let currentKey: CryptoKey | null = null;

function notifyListeners() { listeners.forEach((l) => l([...state])); }

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVault(encKey: CryptoKey | null) {
  const [items, setItems]       = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaveStatus = useCallback((status: SaveStatus) => {
    setSaveStatus(status);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (status === "saved" || status === "error") {
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, []);

  // ── Load + decrypt on key change ──────────────────────────────────────────

  useEffect(() => {
    if (!encKey) {
      state = []; currentKey = null; setItems([]); setIsLoading(false); return;
    }
    let cancelled = false;
    currentKey = encKey;
    setIsLoading(true);

    (async () => {
      try {
        const records = await getAllItems();
        const decrypted = await Promise.all(
          records.map((r) => decryptItem(r, encKey))
        );
        decrypted.sort((a, b) => b.createdAt - a.createdAt);
        if (!cancelled) { state = decrypted; setItems([...state]); }
      } catch (err) {
        console.error("[vault-store] Decryption failed:", err);
        toast.error("Failed to decrypt some items — data may be corrupted.");
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [encKey]);

  // ── Listener subscription ─────────────────────────────────────────────────

  useEffect(() => {
    const l = (next: VaultItem[]) => setItems(next);
    listeners.push(l);
    return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);

  // ─── add ─────────────────────────────────────────────────────────────────

  const add = useCallback(async (
    item: Omit<VaultItem, "id" | "createdAt" | "emoji" | "bgColor"> & { emoji?: string; bgColor?: string }
  ) => {
    if (!currentKey) return;
    const newItem: VaultItem = {
      ...item,
      emoji: item.emoji || categoryEmojis[item.category],
      bgColor: item.bgColor || categoryColors[item.category],
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    flashSaveStatus("saving");
    try {
      const encrypted = await encryptItem(newItem, currentKey);
      await saveItem(encrypted);
      state = [newItem, ...state];
      notifyListeners();
      flashSaveStatus("saved");
      toast.success(`"${newItem.title}" added to vault`);
    } catch (err) {
      console.error("[vault-store] add failed:", err);
      flashSaveStatus("error");
      toast.error("Failed to save item — please try again.");
    }
  }, [flashSaveStatus]);

  // ─── remove ──────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string) => {
    const item = state.find((i) => i.id === id);
    try {
      await deleteItem(id);
      state = state.filter((i) => i.id !== id);
      notifyListeners();
      toast.success(item ? `"${item.title}" deleted` : "Item deleted");
    } catch (err) {
      console.error("[vault-store] remove failed:", err);
      toast.error("Failed to delete item.");
    }
  }, []);

  // ─── update ──────────────────────────────────────────────────────────────

  const update = useCallback(async (id: string, patch: Partial<VaultItem>) => {
    if (!currentKey) return;
    state = state.map((i) => {
      if (i.id !== id) return i;
      let history = i.passwordHistory || [];
      if (patch.password !== undefined && i.password && patch.password !== i.password) {
        history = [{ password: i.password, changedAt: Date.now() }, ...history].slice(0, 20);
      }
      return { ...i, ...patch, passwordHistory: history };
    });
    const updated = state.find((i) => i.id === id);
    if (!updated || !currentKey) return;

    flashSaveStatus("saving");
    try {
      const encrypted = await encryptItem(updated, currentKey);
      await saveItem(encrypted);
      notifyListeners();
      flashSaveStatus("saved");
    } catch (err) {
      console.error("[vault-store] update failed:", err);
      flashSaveStatus("error");
      toast.error("Failed to save changes.");
    }
  }, [flashSaveStatus]);

  return { items, isLoading, saveStatus, add, remove, update };
}
