import { useState, useEffect } from "react";

export type Theme = "light" | "dark";
export type AutoLock = "1" | "5" | "10";
export type ClipboardClear = "15" | "30" | "60" | "never";
export type DefaultView = "grid" | "list" | "compact";
export type SortBy = "created" | "name" | "updated";

export interface Settings {
  autoLock: AutoLock;
  clipboardClear: ClipboardClear;
  defaultView: DefaultView;
  sortBy: SortBy;
  theme: Theme;
  displayName: string;
  email: string;
  avatar: string; // base64 or url
}

const DEFAULT_SETTINGS: Settings = {
  autoLock: "5",
  clipboardClear: "15",
  defaultView: "grid",
  sortBy: "created",
  theme: "light",
  displayName: "",
  email: "",
  avatar: "",
};

const STORAGE_KEY = "vaultly:settings";

/**
 * useSettings — A custom hook to manage and persist Vaultly settings.
 * Stores all settings in a single reactive object and syncs with localStorage.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load settings on mount and listen for external storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          // Only update if actually different to avoid loops
          setSettings(prev => JSON.stringify(prev) === e.newValue ? prev : newSettings);
        } catch (err) {
          console.error("Failed to parse settings from storage:", err);
        }
      }
    };

    const handleCustom = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const newSettings = JSON.parse(saved);
          setSettings(prev => JSON.stringify(prev) === saved ? prev : newSettings);
        }
      } catch (err) {
        console.error("Failed to parse settings from custom event:", err);
      }
    };
    
    window.addEventListener("storage", handleStorage);
    window.addEventListener("vaultly:settings-updated", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("vaultly:settings-updated", handleCustom);
    };
  }, []);

  // Auto-save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    
    // Apply theme globally
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
    
    // Trigger a custom event for reactivity within the same tab
    window.dispatchEvent(new Event("vaultly:settings-updated"));
  }, [settings]);

  /**
   * Updates a specific setting by key.
   */
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return { settings, updateSetting };
}
