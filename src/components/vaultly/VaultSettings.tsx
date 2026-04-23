import { Vault } from "lucide-react";
import { useSettings, type DefaultView, type SortBy } from "@/hooks/useSettings";
import { SegmentedControl } from "./SegmentedControl";

export function VaultSettings() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="font-serif text-[32px] font-bold text-near-black dark:text-white leading-tight tracking-tight">Vault Preferences</h1>
      <p className="text-[14px] text-stone dark:text-silver/60 mt-2 mb-10 font-medium leading-relaxed max-w-xl">
        Manage how your sensitive items are displayed and organized within the vault.
      </p>

      <div className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl p-8 shadow-sm">
        <h3 className="text-[15px] font-bold text-near-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-terracotta/10 rounded-xl flex items-center justify-center">
            <Vault className="w-4.5 h-4.5 text-terracotta" />
          </div>
          Display Preferences
        </h3>

        <div className="divide-y divide-border-cream dark:divide-white/5">
          <div className="flex flex-wrap items-center justify-between gap-6 py-6 first:pt-0">
            <div className="flex flex-col">
              <div className="text-[15px] font-bold text-near-black dark:text-white">Default view</div>
              <div className="text-[13px] text-stone/80 dark:text-silver/50 mt-1 font-medium">Choose how cards appear in the vault</div>
            </div>
            <div className="flex justify-end min-w-[260px]">
              <SegmentedControl
                value={settings.defaultView}
                onChange={(v) => updateSetting("defaultView", v as DefaultView)}
                options={["grid", "list", "compact"]}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 py-6 last:pb-0">
            <div className="flex flex-col">
              <div className="text-[15px] font-bold text-near-black dark:text-white">Sort items by</div>
              <div className="text-[13px] text-stone/80 dark:text-silver/50 mt-1 font-medium">Change the default sorting order</div>
            </div>
            <div className="flex justify-end min-w-[260px]">
              <SegmentedControl
                value={settings.sortBy}
                onChange={(v) => updateSetting("sortBy", v as SortBy)}
                options={["created", "name", "updated"]}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
