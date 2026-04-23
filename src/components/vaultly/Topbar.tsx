import { Search, Lock, Clock, X } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/store/auth-context";
import { useNavigate } from "@tanstack/react-router";
import type { SaveStatus } from "@/lib/vault-store";
import type { VaultCategory } from "@/lib/vault-types";
import { ViewToggle } from "./ViewToggle";
import type { ViewMode } from "@/lib/prefs";
import { UserMenu } from "./UserMenu";
import { ProfileModal } from "./ProfileModal";

export type CategoryFilter = "all" | VaultCategory;

const CAT_LABELS: { id: CategoryFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "password", label: "Passwords" },
  { id: "note",     label: "Notes" },
  { id: "card",     label: "Cards" },
  { id: "totp",     label: "2FA" },
];

interface TopbarProps {
  query: string;
  onQuery: (q: string) => void;
  saveStatus?: SaveStatus;
  categoryFilter: CategoryFilter;
  onCategoryFilter: (c: CategoryFilter) => void;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
  onOpenSettings: () => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

export function Topbar({
  query, onQuery, saveStatus = "idle",
  categoryFilter, onCategoryFilter,
  viewMode, onViewMode,
  onOpenSettings,
  searchRef,
}: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { lockSecondsLeft, lock, extendSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = searchRef ?? internalRef;

  const handleLock = () => { lock(); navigate({ to: "/login" }); };

  const urgent = lockSecondsLeft !== null && lockSecondsLeft <= 30;
  const warn   = lockSecondsLeft !== null && lockSecondsLeft <= 60 && !urgent;
  const show   = lockSecondsLeft !== null && isAuthenticated;

  return (
    <header className="bg-ivory dark:bg-[#1a1a19] border-b border-border-cream dark:border-white/[0.06] flex-shrink-0 transition-colors duration-300">
      {/* Top row: search + controls */}
      <div className="px-6 h-[64px] flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative max-w-[520px]">
          <Search className="w-4 h-4 text-stone dark:text-silver/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={ref}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search vault…  Ctrl+K"
            id="vaultly-search"
            className="w-full h-11 bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/[0.08] rounded-xl pl-10 pr-10 text-[14px] text-near-black dark:text-white placeholder:text-stone/50 dark:placeholder:text-silver/30 outline-none focus:border-terracotta/40 focus:ring-4 focus:ring-terracotta/5 transition-all font-sans"
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-stone hover:text-charcoal dark:hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {/* Save status */}
          {saveStatus !== "idle" && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
              saveStatus === "saving" ? "bg-terracotta/5 text-terracotta border-terracotta/10" :
              saveStatus === "saved"  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" :
              "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
            }`}>
              {saveStatus === "saving" && <div className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />}
              {saveStatus === "saved"  && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              {saveStatus === "error"  && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Error"}
            </div>
          )}

          {/* View mode toggle */}
          <ViewToggle mode={viewMode} onChange={onViewMode} />

          {/* Auto-lock countdown */}
          {show && (
            <div
              onClick={extendSession}
              title="Click to extend session"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none h-9 ${
                urgent ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400" :
                warn   ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400" :
                         "bg-border-light dark:bg-white/[0.04] border-border-cream dark:border-white/[0.08] text-stone dark:text-silver/70"
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${urgent ? "animate-pulse" : ""}`} />
              <span className="whitespace-nowrap">Locks in {formatCountdown(lockSecondsLeft!)}</span>
            </div>
          )}

          {/* User Menu */}
          {isAuthenticated && (
            <UserMenu
              onOpenProfile={() => setProfileOpen(true)}
              onOpenSettings={onOpenSettings}
            />
          )}

          <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="px-6 pb-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {CAT_LABELS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onCategoryFilter(id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] transition-all border ${
              categoryFilter === id
                ? "bg-terracotta text-white border-terracotta shadow-[0_2px_10px_rgba(201,100,66,0.3)]"
                : "bg-parchment dark:bg-[#0f0f0f] text-stone dark:text-silver/50 border-border-cream dark:border-white/[0.08] hover:border-terracotta/30 hover:text-terracotta dark:hover:text-coral"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}

/** Wrap matching text fragments in a <mark> span for search highlighting */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-terracotta/15 text-terracotta rounded-[2px] px-0">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
