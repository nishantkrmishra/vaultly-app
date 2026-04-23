import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

interface GenerateOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

function generatePassword({ length, uppercase, lowercase, numbers, symbols }: GenerateOptions): string {
  const sets = [
    uppercase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    lowercase ? "abcdefghijklmnopqrstuvwxyz" : "",
    numbers   ? "0123456789" : "",
    symbols   ? "!@#$%^&*()_+-=[]{}|;:,.<>?" : "",
  ].filter(Boolean);

  if (sets.length === 0) return "";

  const charset = sets.join("");
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  // Guarantee at least one char from each enabled set
  const result: string[] = [];
  for (const set of sets) {
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    result.push(set[r[0] % set.length]);
  }

  // Fill the rest
  for (let i = result.length; i < length; i++) {
    result.push(charset[arr[i] % charset.length]);
  }

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
}

function assessStrength(pw: string): "weak" | "medium" | "strong" {
  if (pw.length < 8) return "weak";
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNum   = /[0-9]/.test(pw);
  const hasSym   = /[^A-Za-z0-9]/.test(pw);
  const variety  = [hasUpper, hasLower, hasNum, hasSym].filter(Boolean).length;
  if (pw.length >= 20 && variety >= 3) return "strong";
  if (pw.length >= 12 && variety >= 2) return "medium";
  return "weak";
}

interface Props {
  onUse: (password: string) => void;
  initialPassword?: string;
}

export function PasswordGenerator({ onUse, initialPassword }: Props) {
  const [length,    setLength]    = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers,   setNumbers]   = useState(true);
  const [symbols,   setSymbols]   = useState(true);
  const [pw,        setPw]        = useState(initialPassword || "");
  const [copied,    setCopied]    = useState(false);

  const regen = () => {
    const next = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    setPw(next);
  };

  // Auto-regenerate whenever options change
  useEffect(() => {
    regen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, uppercase, lowercase, numbers, symbols]);

  const copy = () => {
    if (!pw) return;
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const strength = pw ? assessStrength(pw) : null;

  const strengthMeta = {
    weak:   { label: "Weak",   bar: "w-1/3",  color: "bg-red-400",   text: "text-red-600 dark:text-red-400" },
    medium: { label: "Fair",   bar: "w-2/3",  color: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
    strong: { label: "Strong", bar: "w-full", color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  };
  const sm = strength ? strengthMeta[strength] : null;

  return (
    <div className="space-y-5">
      {/* Password preview */}
      <div className="bg-ivory dark:bg-card border border-border-cream dark:border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-start gap-3">
          <div className="flex-1 font-mono text-[15px] text-near-black dark:text-white break-all leading-relaxed min-h-[44px] flex items-center">
            {pw || <span className="text-stone dark:text-silver/70 italic font-sans text-[14px]">Click generate…</span>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
            <button
              type="button"
              onClick={regen}
              title="Regenerate"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-terracotta transition-all active:scale-90"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!pw}
              title="Copy"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-charcoal dark:hover:text-white transition-all disabled:opacity-40 active:scale-90"
            >
              {copied ? <Check className="w-4 h-4 text-terracotta" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Strength bar */}
        {sm && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-border-cream dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${sm.bar} ${sm.color}`} />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${sm.text}`}>{sm.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Length slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80">
            Length
          </label>
          <span className="text-[13px] font-mono font-bold text-terracotta tabular-nums">{length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={32}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full h-1.5 bg-border-cream dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-terracotta"
        />
      </div>

      {/* Boolean toggles */}
      <div className="grid grid-cols-2 gap-2.5">
        <Toggle label="Uppercase" sublabel="A–Z" value={uppercase} onChange={setUppercase} />
        <Toggle label="Lowercase" sublabel="a–z" value={lowercase} onChange={setLowercase} />
        <Toggle label="Numbers"   sublabel="0–9" value={numbers}   onChange={setNumbers} />
        <Toggle label="Symbols"   sublabel="!@#" value={symbols}   onChange={setSymbols} />
      </div>

      {/* Actions */}
      <button
        type="button"
        onClick={() => pw && onUse(pw)}
        disabled={!pw}
        className="w-full px-4 py-2.5 rounded-xl bg-terracotta text-white text-[13px] font-bold hover:bg-coral transition-all disabled:opacity-50 active:scale-[0.98] shadow-[0_4px_12px_rgba(201,100,66,0.2)]"
      >
        Use this password
      </button>
    </div>
  );
}

function Toggle({
  label, sublabel, value, onChange,
}: { label: string; sublabel: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left ${
        value
          ? "bg-terracotta/8 border-terracotta/30 dark:bg-terracotta/10 dark:border-terracotta/30"
          : "bg-parchment dark:bg-background border-border-cream dark:border-white/10 hover:border-terracotta/20"
      }`}
    >
      <div>
        <div className={`text-[12px] font-bold ${value ? "text-terracotta" : "text-charcoal dark:text-white/80"}`}>
          {label}
        </div>
        <div className="text-[10px] text-stone dark:text-silver/60 font-mono mt-0.5">{sublabel}</div>
      </div>
      {/* Toggle pill */}
      <div className={`w-9 h-5 rounded-full flex items-center transition-all duration-200 ${value ? "bg-terracotta" : "bg-border-cream dark:bg-white/15"}`}>
        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}
