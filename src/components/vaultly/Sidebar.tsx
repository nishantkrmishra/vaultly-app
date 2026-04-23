import { LayoutGrid, Key, FileText, CreditCard, ShieldCheck, Settings, Plus } from "lucide-react";
import type { VaultCategory } from "@/lib/vault-types";

type View = "all" | VaultCategory | "settings";

interface SidebarProps {
  view: View;
  onView: (v: View) => void;
  onNew: () => void;
}

const navItems: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Items", icon: LayoutGrid },
  { id: "password", label: "Passwords", icon: Key },
  { id: "note", label: "Secure Notes", icon: FileText },
  { id: "card", label: "Credit Cards", icon: CreditCard },
  { id: "totp", label: "Authenticator", icon: ShieldCheck },
];

export function Sidebar({ view, onView, onNew }: SidebarProps) {
  return (
    <aside className="w-[240px] min-w-[240px] bg-[#141413] flex flex-col py-6 h-screen border-r border-white/[0.06] z-20">
      {/* Brand */}
      <div className="px-5 pb-7">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(201,100,66,0.4)]">
            <span className="text-[16px]">🗝️</span>
          </div>
          <div>
            <div className="font-serif text-[18px] font-bold text-white leading-none tracking-tight">Vaultly</div>
            <div className="text-[11px] text-white/25 font-bold uppercase tracking-[0.18em] mt-1.5">Secure Vault</div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/20">Navigation</span>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5 flex-1">
        {navItems.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onView(it.id)}
              className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-[14px] font-medium transition-all w-full text-left active:scale-[0.98] ${active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/75"
                }`}
            >
              {/* Active bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terracotta rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? "text-terracotta" : "opacity-50"}`} />
              <span className={active ? "font-semibold" : ""}>{it.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-5 my-3 border-t border-white/[0.06]" />

      {/* Bottom actions */}
      <div className="px-3 space-y-1">
        <button
          onClick={onNew}
          id="sidebar-new-item-btn"
          className="w-full px-4 py-2.5 rounded-xl bg-terracotta text-white font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-coral hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-[0_6px_20px_rgba(201,100,66,0.28)] tracking-tight"
        >
          <Plus className="w-4 h-4" />
          New Item
        </button>

        <button
          onClick={() => onView("settings")}
          className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-[14px] font-medium transition-all w-full active:scale-[0.98] ${view === "settings"
              ? "bg-white/[0.08] text-white font-semibold"
              : "text-white/45 hover:bg-white/[0.04] hover:text-white/75"
            }`}
        >
          {view === "settings" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terracotta rounded-r-full" />
          )}
          <Settings className={`w-4 h-4 flex-shrink-0 transition-colors ${view === "settings" ? "text-terracotta" : "opacity-50"}`} />
          Settings
        </button>
      </div>
    </aside>
  );
}
