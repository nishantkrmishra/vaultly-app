import { Palette, Sun, Moon } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function AppearanceSettings() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="font-serif text-[32px] font-bold text-near-black dark:text-white leading-tight tracking-tight">Appearance</h1>
      <p className="text-[14px] text-stone dark:text-silver/60 mt-2 mb-10 font-medium leading-relaxed max-w-xl">
        Customize the visual identity of your vault. Choose a theme that fits your workflow.
      </p>

      <div className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl p-8 shadow-sm">
        <h3 className="text-[15px] font-bold text-near-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-terracotta/10 rounded-xl flex items-center justify-center">
            <Palette className="w-4.5 h-4.5 text-terracotta" />
          </div>
          Theme Selection
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => updateSetting("theme", "light")}
            className={`group p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-5 transition-all hover:-translate-y-1 active:scale-[0.98] ${
              settings.theme === "light"
                ? "border-terracotta bg-terracotta/5 shadow-[0_12px_30px_rgba(201,100,66,0.15)]"
                : "border-border-cream dark:border-white/10 hover:border-terracotta/30 bg-parchment dark:bg-[#0f0f0f] shadow-sm"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${settings.theme === "light" ? "bg-terracotta/10 shadow-inner" : "bg-stone/5 group-hover:bg-terracotta/5"}`}>
              <Sun className={`w-7 h-7 transition-colors ${settings.theme === "light" ? "text-terracotta" : "text-stone/50 group-hover:text-terracotta/60"}`} />
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-[15px] font-bold transition-colors ${settings.theme === "light" ? "text-terracotta" : "text-stone dark:text-silver/80 group-hover:text-near-black"}`}>Light Mode</span>
              <span className="text-[11px] text-stone/50 dark:text-silver/40 mt-1.5 font-medium uppercase tracking-wider">Classic warm paper</span>
            </div>
          </button>
          
          <button
            onClick={() => updateSetting("theme", "dark")}
            className={`group p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-5 transition-all hover:-translate-y-1 active:scale-[0.98] ${
              settings.theme === "dark"
                ? "border-terracotta bg-terracotta/5 shadow-[0_12px_30px_rgba(201,100,66,0.15)]"
                : "border-border-cream dark:border-white/10 hover:border-terracotta/30 bg-parchment dark:bg-[#0f0f0f] shadow-sm"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${settings.theme === "dark" ? "bg-terracotta/10 shadow-inner" : "bg-stone/5 group-hover:bg-terracotta/5"}`}>
              <Moon className={`w-7 h-7 transition-colors ${settings.theme === "dark" ? "text-terracotta" : "text-stone/50 dark:text-silver/50 group-hover:text-terracotta/60"}`} />
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-[15px] font-bold transition-colors ${settings.theme === "dark" ? "text-terracotta" : "text-stone dark:text-silver/80 group-hover:text-white"}`}>Dark Mode</span>
              <span className="text-[11px] text-stone/50 dark:text-silver/40 mt-1.5 font-medium uppercase tracking-wider">Deep neutral obsidian</span>
            </div>
          </button>
        </div>
        
        <div className="h-px bg-border-cream dark:bg-white/5 my-8" />
        <p className="text-[11px] text-stone/50 dark:text-silver/40 text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
