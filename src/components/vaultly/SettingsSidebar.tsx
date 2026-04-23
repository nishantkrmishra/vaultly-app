import { User, Shield, Palette, Vault, Database } from "lucide-react";
import type { SettingsTab } from "./SettingsLayout";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "vault", label: "Vault", icon: Vault },
    { id: "data", label: "Data & Backup", icon: Database },
  ] as const;

  return (
    <aside className="w-full md:w-[220px] lg:w-[240px] flex-shrink-0 space-y-0.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-[13px] font-medium transition-all w-full text-left active:scale-[0.98] ${
              isActive
                ? "bg-border-light dark:bg-white/[0.08] text-near-black dark:text-white"
                : "text-stone dark:text-silver/60 hover:bg-border-light/50 dark:hover:bg-white/[0.04] hover:text-charcoal dark:hover:text-white"
            }`}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terracotta rounded-r-full" />
            )}
            <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-terracotta" : "opacity-50"}`} />
            <span className={isActive ? "font-semibold" : ""}>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
