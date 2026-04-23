import { Shield, Key } from "lucide-react";
import { useSettings, type AutoLock, type ClipboardClear } from "@/hooks/useSettings";
import { SegmentedControl } from "./SegmentedControl";

interface SecuritySettingsProps {
  onOpenChangePw?: () => void;
  onOpenRegenKey?: () => void;
}

export function SecuritySettings({ onOpenChangePw, onOpenRegenKey }: SecuritySettingsProps) {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="font-serif text-[32px] font-bold text-near-black dark:text-white leading-tight tracking-tight">Security</h1>
      <p className="text-[14px] text-stone dark:text-silver/60 mt-2 mb-10 font-medium leading-relaxed max-w-xl">
        Update your master password and configure your vault's automated security behaviors.
      </p>
      
      {/* Auto-Lock & Clipboard */}
      <div className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl p-8 mb-8 shadow-sm">
        <h3 className="text-[15px] font-bold text-near-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-terracotta/10 rounded-xl flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-terracotta" />
          </div>
          Vault Behaviors
        </h3>

        <div className="divide-y divide-border-cream dark:divide-white/5">
          <div className="flex flex-wrap items-center justify-between gap-6 py-6 first:pt-0">
            <div className="flex flex-col">
              <div className="text-[15px] font-bold text-near-black dark:text-white">Auto-lock vault</div>
              <div className="text-[13px] text-stone/80 dark:text-silver/50 mt-1 font-medium">Lock after period of inactivity</div>
            </div>
            <div className="flex justify-end min-w-[260px]">
              <SegmentedControl
                value={settings.autoLock}
                onChange={(v) => updateSetting("autoLock", v as AutoLock)}
                options={[
                  { label: "1 min", value: "1" },
                  { label: "5 min", value: "5" },
                  { label: "10 min", value: "10" },
                ]}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 py-6 last:pb-0">
            <div className="flex flex-col">
              <div className="text-[15px] font-bold text-near-black dark:text-white">Clear clipboard</div>
              <div className="text-[13px] text-stone/80 dark:text-silver/50 mt-1 font-medium">Wipe copied passwords after use</div>
            </div>
            <div className="flex justify-end min-w-[260px]">
              <SegmentedControl
                value={settings.clipboardClear}
                onChange={(v) => updateSetting("clipboardClear", v as ClipboardClear)}
                options={[
                  { label: "15s", value: "15" },
                  { label: "30s", value: "30" },
                  { label: "60s", value: "60" },
                  { label: "Never", value: "never" },
                ]}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Master Password Placeholder */}
      <div className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl p-8 shadow-sm">
        <h3 className="text-[15px] font-bold text-near-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-terracotta/10 rounded-xl flex items-center justify-center">
            <Key className="w-4.5 h-4.5 text-terracotta" />
          </div>
          Access &amp; Recovery
        </h3>
        <div className="flex flex-col mb-8">
          <p className="text-[14px] text-stone dark:text-silver/60 leading-relaxed font-medium max-w-lg">
            Your master password is the key to everything in your vault. Change it regularly or regenerate your emergency recovery key.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onOpenChangePw}
            className="px-6 py-3 rounded-xl border border-border-cream dark:border-white/10 bg-parchment dark:bg-[#0f0f0f] text-charcoal dark:text-white text-[13.5px] font-bold hover:border-terracotta/40 hover:text-terracotta transition-all shadow-sm active:scale-[0.98]"
          >
            Change Master Password
          </button>
          <button 
            onClick={onOpenRegenKey}
            className="px-6 py-3 rounded-xl border border-border-cream dark:border-white/10 bg-parchment dark:bg-[#0f0f0f] text-charcoal dark:text-white text-[13.5px] font-bold hover:border-terracotta/40 hover:text-terracotta transition-all shadow-sm active:scale-[0.98]"
          >
            Regenerate Recovery Key
          </button>
        </div>
      </div>
    </div>
  );
}
  );
}
