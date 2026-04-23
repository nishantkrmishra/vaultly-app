import { useState } from "react";
import { User, Check } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";

export function AccountSettings() {
  const { settings, updateSetting } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Account settings saved");
    }, 400);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="font-serif text-[32px] font-bold text-near-black dark:text-white leading-tight tracking-tight">Account</h1>
      <p className="text-[14px] text-stone dark:text-silver/60 mt-2 mb-10 font-medium leading-relaxed max-w-xl">
        Manage your personal profile and local account preferences.
      </p>
      
      <div className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl p-8 shadow-sm">
        <h3 className="text-[15px] font-bold text-near-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-terracotta/10 rounded-xl flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-terracotta" />
          </div>
          Profile Information
        </h3>
        
        <div className="space-y-6 max-w-md">
          <div className="flex flex-col gap-3">
            <label htmlFor="display-name" className="text-[12px] font-bold uppercase tracking-[0.12em] text-stone dark:text-silver/50">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSetting("displayName", e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl px-4 h-11 text-[14px] text-near-black dark:text-white outline-none focus:border-terracotta/50 focus:ring-4 focus:ring-terracotta/10 transition-all placeholder:text-stone/30"
            />
            <p className="text-[12px] text-stone/50 dark:text-silver/40 font-medium">
              This name is only stored locally on your device.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border-cream dark:border-white/5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-terracotta text-white text-[13.5px] font-semibold hover:bg-coral transition-all shadow-[0_4px_14px_rgba(201,100,66,0.25)] active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : <><Check className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
