import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, Shield, ChevronRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/store/auth-context";
import { useNavigate } from "@tanstack/react-router";

interface UserMenuProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function UserMenu({ onOpenProfile, onOpenSettings }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const { lock } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = settings.displayName ? settings.displayName[0].toUpperCase() : "U";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLock = () => {
    setIsOpen(false);
    lock();
    navigate({ to: "/login" });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta font-bold text-[13px] hover:bg-terracotta/20 hover:scale-105 transition-all duration-200 shadow-sm"
      >
        {settings.avatar ? (
          <img src={settings.avatar} alt={settings.displayName} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[280px] bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Section */}
          <div className="px-4 py-5 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta font-bold text-[18px] shadow-sm">
              {settings.avatar ? (
                <img src={settings.avatar} alt={settings.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-near-black dark:text-white truncate leading-tight">
                {settings.displayName || "Vault User"}
              </div>
              <div className="text-[11px] text-stone dark:text-silver/50 truncate mt-1 tracking-wide font-medium">
                {settings.email || "local@vaultly.app"}
              </div>
            </div>
          </div>

          <div className="h-px bg-border-cream dark:bg-white/5 my-2 mx-2" />

          {/* Actions Section */}
          <div className="space-y-1">
            <button
              onClick={() => { setIsOpen(false); onOpenProfile(); }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13.5px] font-medium text-stone dark:text-silver/80 hover:bg-parchment dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-white transition-all group"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-stone/60 group-hover:text-terracotta transition-colors" />
                Profile Details
              </div>
              <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => { setIsOpen(false); onOpenSettings(); }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13.5px] font-medium text-stone dark:text-silver/80 hover:bg-parchment dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-white transition-all group"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-stone/60 group-hover:text-terracotta transition-colors" />
                Vault Settings
              </div>
              <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={handleLock}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13.5px] font-medium text-stone dark:text-silver/80 hover:bg-parchment dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-white transition-all group"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-stone/60 group-hover:text-terracotta transition-colors" />
                Lock Vault
              </div>
              <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="h-px bg-border-cream dark:bg-white/5 my-2 mx-2" />

          {/* Logout Section */}
          <button
            onClick={handleLock}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13.5px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
