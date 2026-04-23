import { useEffect, useState } from "react";
import type { VaultItem } from "@/lib/vault-types";
import { assessStrength } from "@/lib/vault-types";
import { generateTOTP } from "@/lib/totp";
import { faviconFor } from "@/lib/favicon";
import { Eye, Copy, Check, ExternalLink, User } from "lucide-react";
import { PasswordStrength } from "./PasswordStrength";
import { highlightMatch } from "./Topbar";
import type { ViewMode } from "@/lib/prefs";
import { useToast } from "./ToastProvider";

interface Props {
  item: VaultItem;
  onOpen: (item: VaultItem) => void;
  viewMode?: ViewMode;
  query?: string;
}

const AUTO_CLEAR_MS = 30_000;

export function VaultItemCard({ item, onOpen, viewMode = "grid", query = "" }: Props) {
  const [code, setCode]           = useState("");
  const [iconError, setIconError] = useState(false);
  const [copied, setCopied]       = useState<string | null>(null);
  const { success } = useToast();

  useEffect(() => {
    if (!item.totp) return;
    const tick = () => { const { code: c } = generateTOTP(item.totp!); setCode(c); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [item.totp]);

  const strength = item.password ? assessStrength(item.password) : null;
  const favicon  = faviconFor(item);

  const copyField = (e: React.MouseEvent, type: string, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(type);
    success(`${label} copied`);
    setTimeout(() => { navigator.clipboard.writeText("").catch(() => {}); }, AUTO_CLEAR_MS);
    setTimeout(() => setCopied(null), 2000);
  };

  const getBgClass = () => {
    switch (item.category) {
      case "note": return "bg-[#fcfbf9] dark:bg-[#1c1c18] border-border-cream dark:border-[#2a2a22]";
      case "card": return "bg-[#f7f9fc] dark:bg-[#161b22] border-border-cream dark:border-[#1c2838]";
      case "totp": return "bg-[#fbf7fc] dark:bg-[#1a1622] border-border-cream dark:border-[#2b1f36]";
      default:     return "bg-ivory dark:bg-[#1a1a1a] border-border-cream dark:border-white/5";
    }
  };

  const iconEl = (
    <div
      className={`rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden border border-border-cream/60 dark:border-white/10 ${
        favicon && !iconError ? "bg-white dark:bg-[#e8e8e8]" : ""
      } ${viewMode === "compact" ? "w-7 h-7 text-sm" : "w-10 h-10"}`}
      style={!favicon || iconError ? { background: item.bgColor } : undefined}
    >
      {favicon && !iconError ? (
        <img src={favicon} alt="" className="w-full h-full object-contain" onError={() => setIconError(true)} />
      ) : item.emoji ? (
        <span className={viewMode === "compact" ? "text-sm" : ""}>{item.emoji}</span>
      ) : (
        <span className={`text-white font-bold uppercase ${viewMode === "compact" ? "text-[12px]" : "text-[18px]"}`}>
          {item.title.charAt(0)}
        </span>
      )}
    </div>
  );

  const subtitle =
    item.category === "card"
      ? `•••• ${item.cardNumber?.slice(-4) ?? ""}`
      : item.category === "note"
      ? item.notes?.slice(0, 60) || "Secure note"
      : item.username || item.url || "";

  const quickActions = (
    <div className="flex items-center gap-0.5">
      {item.url && (
        <a href={item.url.startsWith("http") ? item.url : `https://${item.url}`} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
          title="Open Website">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
      {item.username && (
        <button onClick={(e) => copyField(e, "user", item.username!, "Username")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
          title="Copy Username">
          {copied === "user" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <User className="w-3.5 h-3.5" />}
        </button>
      )}
      {item.password && (
        <button onClick={(e) => copyField(e, "pw", item.password!, "Password")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
          title="Copy Password">
          {copied === "pw" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
      <button onClick={() => onOpen(item)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
        title="View Details">
        <Eye className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // ── COMPACT (table row) ──────────────────────────────────────────────────
  if (viewMode === "compact") {
    return (
      <div className={`group ${getBgClass()} border-b last:border-b-0 px-5 py-3 flex items-center gap-4 hover:bg-black/3 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer`}
        onClick={() => onOpen(item)}>
        {iconEl}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <span className="text-[15px] font-medium text-near-black dark:text-white truncate min-w-[120px] max-w-[200px]">
            {highlightMatch(item.title, query)}
          </span>
          <span className="text-[13px] text-stone dark:text-silver/60 truncate flex-1 hidden sm:block">
            {highlightMatch(subtitle, query)}
          </span>
        </div>
        {item.category === "totp" && (
          <span className="font-mono text-[13.5px] bg-parchment dark:bg-black/20 border border-border-cream dark:border-white/10 px-2 py-0.5 rounded-lg text-charcoal dark:text-white tracking-widest tabular-nums flex-shrink-0">
            {code || "••• •••"}
          </span>
        )}
        {item.category === "password" && strength && <div className="hidden sm:block flex-shrink-0"><PasswordStrength strength={strength} /></div>}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {quickActions}
        </div>
      </div>
    );
  }

  // ── LIST (single column, larger row) ─────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className={`relative group ${getBgClass()} border rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-black/3 dark:hover:bg-white/5 hover:border-terracotta/30 dark:hover:border-white/15 transition-all duration-150 cursor-pointer`}
        onClick={() => onOpen(item)}>
        {iconEl}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-near-black dark:text-white truncate">
            {highlightMatch(item.title, query)}
          </div>
          <div className="text-[13px] text-stone dark:text-silver/60 mt-0.5 truncate">
            {highlightMatch(subtitle, query)}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {item.category === "totp" && (
            <span className="font-mono text-[13.5px] bg-parchment dark:bg-black/20 border border-border-cream dark:border-white/10 px-2.5 py-1 rounded-lg text-charcoal dark:text-white tracking-widest tabular-nums">
              {code || "••• •••"}
            </span>
          )}
          {item.category === "password" && strength && <div className="hidden sm:block"><PasswordStrength strength={strength} /></div>}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {quickActions}
          </div>
        </div>
      </div>
    );
  }

  // ── GRID (default card) ──────────────────────────────────────────────────
  return (
    <div className="relative group">
      <button
        onClick={() => onOpen(item)}
        className={`w-full ${getBgClass()} border rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-lg hover:border-terracotta/20 dark:hover:border-white/10 transition-all duration-200 text-left cursor-pointer active:scale-[0.99]`}
      >
        {iconEl}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[15px] font-semibold text-near-black dark:text-white truncate leading-tight tracking-tight">
            {highlightMatch(item.title, query)}
          </div>
          <div className="text-[13px] text-stone dark:text-silver/60 mt-1 truncate tracking-wide font-medium">
            {highlightMatch(subtitle, query)}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 group-hover:opacity-0 transition-all duration-200 justify-end ml-auto">
          {item.category === "password" && strength && (
            <div className="hidden sm:block scale-90 origin-right"><PasswordStrength strength={strength} /></div>
          )}
          {item.category === "totp" && (
            <span className="font-mono text-[12.5px] bg-parchment dark:bg-black/20 border border-border-cream dark:border-white/10 px-2 py-0.5 rounded-lg text-charcoal dark:text-white tracking-widest tabular-nums text-center font-bold">
              {code || "••• •••"}
            </span>
          )}
          {item.category === "card" && (
            <span className="text-[12px] text-stone dark:text-silver/60 font-bold uppercase tracking-wider">{item.cardExpiry}</span>
          )}
        </div>
      </button>

      {/* Quick actions overlay */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto bg-ivory dark:bg-[#1e1e1c] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-border-cream dark:border-white/10 p-1.5 rounded-2xl"
        onClick={(e) => e.stopPropagation()}>
        {item.url && (
          <a href={item.url.startsWith("http") ? item.url : `https://${item.url}`} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
            title="Open Website">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {item.username && (
          <button onClick={(e) => copyField(e, "user", item.username!, "Username")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
            title="Copy Username">
            {copied === "user" ? <Check className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4" />}
          </button>
        )}
        {item.password && (
          <button onClick={(e) => copyField(e, "pw", item.password!, "Password")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
            title="Copy Password">
            {copied === "pw" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
        <button onClick={() => onOpen(item)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-stone dark:text-silver/90 hover:text-terracotta hover:bg-border-light dark:hover:bg-white/5 transition-all"
          title="View Details">
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
