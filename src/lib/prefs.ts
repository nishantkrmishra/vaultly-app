/**
 * prefs.ts — Typed localStorage preferences for Vaultly.
 * All keys are prefixed with "vaultly:" for isolation.
 */

export type ViewMode   = "grid" | "list" | "compact";
export type SortBy     = "created" | "name" | "updated";
export type Density    = "comfortable" | "compact";
export type AutoLockMs = 0 | 1 | 5 | 10 | 15 | 30; // minutes (0 = never)
export type ClipClearMs = 15 | 30 | 60 | 0; // seconds (0 = never)

export interface VaultPrefs {
  viewMode:    ViewMode;
  sortBy:      SortBy;
  autoLockMin: AutoLockMs;
  clipClearSec: ClipClearMs;
}

const DEFAULTS: VaultPrefs = {
  viewMode:    "grid",
  sortBy:      "created",
  autoLockMin: 10,
  clipClearSec: 30,
};

function key(k: keyof VaultPrefs): string {
  return `vaultly:pref:${k}`;
}

export function getPref<K extends keyof VaultPrefs>(k: K): VaultPrefs[K] {
  try {
    const raw = localStorage.getItem(key(k));
    if (raw === null) return DEFAULTS[k];
    return JSON.parse(raw) as VaultPrefs[K];
  } catch {
    return DEFAULTS[k];
  }
}

export function setPref<K extends keyof VaultPrefs>(k: K, v: VaultPrefs[K]): void {
  try {
    localStorage.setItem(key(k), JSON.stringify(v));
  } catch { /* quota exceeded — ignore */ }
}

import { useState, useEffect } from "react";

export function useVaultPrefs() {
  const [prefs, setPrefs] = useState<VaultPrefs>(() => getAllPrefs());

  useEffect(() => {
    const handler = () => setPrefs(getAllPrefs());
    window.addEventListener("vaultly:prefs", handler);
    return () => window.removeEventListener("vaultly:prefs", handler);
  }, []);

  const updatePref = <K extends keyof VaultPrefs>(k: K, v: VaultPrefs[K]) => {
    setPref(k, v);
    window.dispatchEvent(new Event("vaultly:prefs"));
  };

  return { ...prefs, updatePref };
}
