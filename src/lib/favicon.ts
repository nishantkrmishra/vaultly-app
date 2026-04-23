import type { VaultItem } from "./vault-types";

export function faviconFor(item: Pick<VaultItem, "url" | "category" | "customIconUrl">): string | null {
  if (item.customIconUrl) return item.customIconUrl;
  if (!item.url) return null;
  if (item.category !== "password" && item.category !== "totp") return null;
  
  try {
    const u = new URL(item.url.startsWith("http") ? item.url : `https://${item.url}`);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function domainOf(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function extractServiceName(url?: string): string | null {
  const domain = domainOf(url);
  if (!domain) return null;
  // Handle common cases like github.com, google.com
  const part = domain.split(".")[0];
  if (!part) return null;
  return part.charAt(0).toUpperCase() + part.slice(1);
}
