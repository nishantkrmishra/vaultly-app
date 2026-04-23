import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sun, Moon, LogOut, Shield, Loader2, KeyRound, RefreshCw, Download, PlusCircle, User, Lock, Palette, Vault, HardDrive, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/vaultly/Sidebar";
import { Topbar, type CategoryFilter } from "@/components/vaultly/Topbar";
import { VaultItemCard } from "@/components/vaultly/VaultItemCard";
import { NewItemDialog } from "@/components/vaultly/NewItemDialog";
import { ItemDetailDialog } from "@/components/vaultly/ItemDetailDialog";
import { SettingsLayout } from "@/components/vaultly/SettingsLayout";
import { ChangeMasterPasswordModal } from "@/components/vaultly/ChangeMasterPasswordModal";
import { BackupModal } from "@/components/vaultly/BackupModal";
import { RegenerateRecoveryKeyModal } from "@/components/vaultly/RegenerateRecoveryKeyModal";
import { useVault } from "@/lib/vault-store";
import { useAuth } from "@/store/auth-context";
import type { VaultCategory, VaultItem } from "@/lib/vault-types";
import { categoryLabels } from "@/lib/vault-types";
import { useSettings } from "@/hooks/useSettings";
import { ToastProvider } from "@/components/vaultly/ToastProvider";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Vaultly — Secure Password Vault" },
      { name: "description", content: "Vaultly is a warm, calm password manager for storing passwords, secure notes, cards, and 2FA codes." },
    ],
  }),
});

type View = "all" | VaultCategory | "settings";

function Index() {
  const { encKey, lock, hasRecoveryKey, recoveryKeyGeneratedAt, recoveryConfirmed } = useAuth();
  const { items, isLoading, saveStatus, add, remove, update } = useVault(encKey);
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();
  const [view, setView]             = useState<View>("all");
  const [query, setQuery]           = useState("");
  const [catFilter, setCatFilter]   = useState<CategoryFilter>("all");
  const [open, setOpen]             = useState(false);
  const [active, setActive]         = useState<VaultItem | null>(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showBackup, setShowBackup]     = useState(false);
  const [showRegenKey, setShowRegenKey] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleViewMode = (m: any) => updateSetting("defaultView", m);
  const handleSortBy   = (s: any) => updateSetting("sortBy", s);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "n" && (e.ctrlKey || e.metaKey) && !inInput) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "L" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        lock(); navigate({ to: "/login" });
      }
      if (e.key === "Escape") {
        setOpen(false); setActive(null);
        setShowChangePw(false); setShowBackup(false); setShowRegenKey(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lock, navigate]);

  const filtered = useMemo(() => {
    let list = items;
    // Category sidebar filter
    if (view !== "all" && view !== "settings") list = list.filter((i) => i.category === view);
    // Topbar chip filter
    if (catFilter !== "all") list = list.filter((i) => i.category === catFilter);
    // Text search
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) =>
      [i.title, i.username, i.url, i.notes, i.cardHolder].filter(Boolean).some((x) => x!.toLowerCase().includes(q))
    );
    // Sort
    list = [...list].sort((a, b) =>
      settings.sortBy === "name"    ? a.title.localeCompare(b.title) :
      settings.sortBy === "updated" ? (b.createdAt - a.createdAt) :
                             (b.createdAt - a.createdAt)
    );
    return list;
  }, [items, view, catFilter, query, settings.sortBy]);

  const grouped = useMemo(() => {
    const groups: Record<VaultCategory, typeof items> = { password: [], note: [], card: [], totp: [] };
    filtered.forEach((i) => groups[i.category].push(i));
    return groups;
  }, [filtered]);

  const defaultCat: VaultCategory = view === "settings" || view === "all" ? "password" : view;
  const handleLock = () => { lock(); navigate({ to: "/login" }); };

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-dark-surface">
        <Sidebar view={view} onView={setView} onNew={() => setOpen(true)} />

        <main
          data-theme={settings.theme === "dark" ? "dark" : undefined}
          className="flex-1 flex flex-col overflow-hidden bg-background transition-colors duration-300"
        >
          <Topbar
            query={query} onQuery={setQuery} saveStatus={saveStatus}
            categoryFilter={catFilter} onCategoryFilter={setCatFilter}
            viewMode={settings.defaultView as any} onViewMode={handleViewMode}
            onOpenSettings={() => setView("settings")}
            searchRef={searchRef}
          />

        <div className="flex-1 overflow-y-auto scrollbar-warm px-7 py-7 pb-12">
          {view === "settings" ? (
            <SettingsLayout
              onOpenChangePw={() => setShowChangePw(true)}
              onOpenBackup={() => setShowBackup(true)}
              onOpenRegenKey={() => setShowRegenKey(true)}
            />
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-serif text-[36px] font-semibold text-near-black dark:text-white leading-tight tracking-tight">
                  {view === "all" ? "All items" : categoryLabels[view]}
                </h1>
                <p className="text-[13.5px] text-stone dark:text-silver/70 mt-2 font-medium">
                  {isLoading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Decrypting vault…
                    </span>
                  ) : (
                    <>
                      {filtered.length} {filtered.length === 1 ? "item" : "items"}
                      {query && <> matching "{query}"</>}
                    </>
                  )}
                </p>
              </div>

              {isLoading ? (
                <LoadingSkeleton />
              ) : filtered.length === 0 ? (
                query ? (
                  <div className="border border-dashed border-border-cream dark:border-white/10 rounded-2xl py-16 flex flex-col items-center text-center bg-ivory/50 dark:bg-background/50">
                    <div className="text-[15px] font-medium text-stone dark:text-silver/80">No results found for "{query}"</div>
                  </div>
                ) : (
                  <EmptyState onNew={() => setOpen(true)} view={view} />
                )
              ) : view === "all" && catFilter === "all" ? (
                (Object.keys(grouped) as VaultCategory[]).map((cat) =>
                  grouped[cat].length ? (
                    <section key={cat} className={`mb-10 ${settings.defaultView === "compact" ? "border border-border-cream dark:border-white/5 rounded-xl overflow-hidden" : ""}`}>
                      <div className="text-[12px] font-bold text-stone dark:text-silver/80 uppercase tracking-[0.08em] mb-3">{categoryLabels[cat]}</div>
                      <ItemGrid items={grouped[cat]} onOpen={setActive} viewMode={settings.defaultView as any} query={query} />
                    </section>
                  ) : null
                )
              ) : (
                <ItemGrid items={filtered} onOpen={setActive} viewMode={settings.defaultView as any} query={query} />
              )}
            </>
          )}
        </div>
        </main>

        <NewItemDialog
          open={open}
          onClose={() => setOpen(false)}
          onAdd={add}
          defaultCategory={defaultCat}
          theme={settings.theme}
        />
        <ChangeMasterPasswordModal open={showChangePw} onClose={() => setShowChangePw(false)} />
        <BackupModal open={showBackup} onClose={() => setShowBackup(false)} onImportComplete={() => { lock(); navigate({ to: "/login" }); }} />
        <RegenerateRecoveryKeyModal open={showRegenKey} onClose={() => setShowRegenKey(false)} />
        <ItemDetailDialog
          item={active}
          onClose={() => setActive(null)}
          onSave={(id, patch) => {
            update(id, patch);
            setActive((a) => (a && a.id === id ? { ...a, ...patch } : a));
          }}
          onDelete={remove}
          theme={settings.theme}
        />
      </div>
    </ToastProvider>
  );
}

function ItemGrid({ items, onOpen, viewMode, query }: {
  items: VaultItem[]; onOpen: (i: VaultItem) => void; viewMode: ViewMode; query: string;
}) {
  if (viewMode === "compact") {
    return (
      <div className="border border-border-cream dark:border-white/5 rounded-xl overflow-hidden">
        {items.map((item) => <VaultItemCard key={item.id} item={item} onOpen={onOpen} viewMode="compact" query={query} />)}
      </div>
    );
  }
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((item) => <VaultItemCard key={item.id} item={item} onOpen={onOpen} viewMode="list" query={query} />)}
      </div>
    );
  }
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
      {items.map((item) => <VaultItemCard key={item.id} item={item} onOpen={onOpen} viewMode="grid" query={query} />)}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4 animate-pulse"
        >
          <div className="w-10 h-10 rounded-xl bg-border-cream dark:bg-white/5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-border-cream dark:bg-white/5 rounded-lg w-3/4" />
            <div className="h-3 bg-border-cream dark:bg-white/5 rounded-lg w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}


function EmptyState({ onNew, view }: { onNew: () => void; view: View }) {
  let title = "Your vault is empty";
  let desc = "Add your first item to keep it safely encrypted and tucked away.";
  let btn = "Add your first item";

  if (view === "password") {
    title = "No passwords saved yet";
    desc = "Securely store your login credentials here.";
    btn = "Add password";
  } else if (view === "totp") {
    title = "No 2FA accounts";
    desc = "Add your first 2FA account to generate secure one-time passwords.";
    btn = "Add authenticator";
  } else if (view === "card") {
    title = "No cards saved";
    desc = "Store your credit and debit cards securely for easy access.";
    btn = "Add payment card";
  } else if (view === "note") {
    title = "No secure notes";
    desc = "Keep your sensitive text and documents encrypted and safe.";
    btn = "Add secure note";
  }

  return (
    <div className="border border-dashed border-border-cream dark:border-white/[0.08] rounded-2xl py-20 flex flex-col items-center text-center bg-ivory/40 dark:bg-background/40">
      <div className="text-5xl mb-4">🗝️</div>
      <div className="font-serif text-[22px] font-semibold text-near-black dark:text-white">{title}</div>
      <p className="text-[13.5px] text-stone dark:text-silver/70 mt-2 max-w-sm leading-relaxed">{desc}</p>
      <button
        onClick={onNew}
        className="mt-6 px-5 py-2.5 rounded-xl bg-terracotta text-white text-[13.5px] font-semibold hover:bg-coral transition-all shadow-[0_4px_14px_rgba(201,100,66,0.25)] active:scale-95"
      >
        + {btn}
      </button>
    </div>
  );
}


