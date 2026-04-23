import { useEffect, useState } from "react";
import { X, Eye, EyeOff, QrCode, Plus, Sparkles, Key, FileText, CreditCard, Shield, AlertTriangle, CheckCircle, Copy, Check } from "lucide-react";
import { PasswordStrength } from "./PasswordStrength";
import type { VaultCategory, VaultItem } from "@/lib/vault-types";
import { assessStrength } from "@/lib/vault-types";
import { validateTotpSecret } from "@/lib/totp";
import { PasswordGenerator } from "./PasswordGenerator";
import { extractServiceName } from "@/lib/favicon";
import { generateTOTP } from "@/lib/totp";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<VaultItem, "id" | "createdAt" | "emoji" | "bgColor">) => void;
  defaultCategory?: VaultCategory;
  theme?: "light" | "dark";
}

const TABS: { id: VaultCategory; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "password", label: "Password", icon: Key, desc: "Store login credentials securely" },
  { id: "note", label: "Note", icon: FileText, desc: "Save encrypted text notes" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Store payment card details" },
  { id: "totp", label: "2FA", icon: Shield, desc: "Generate two-factor codes" },
];

export function NewItemDialog({ open, onClose, onAdd, defaultCategory = "password", theme }: Props) {
  const [cat, setCat] = useState<VaultCategory>(defaultCategory);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [totp, setTotp] = useState("");
  const [notes, setNotes] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (open) setCat(defaultCategory); }, [open, defaultCategory]);

  useEffect(() => {
    if (!open) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Live TOTP preview
  useEffect(() => {
    if (cat !== "totp" || !totp || totpError) { setTotpCode(""); return; }
    const tick = () => {
      try { const { code } = generateTOTP(totp); setTotpCode(code); }
      catch { setTotpCode(""); }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [cat, totp, totpError]);

  if (!open) return null;

  const reset = () => {
    setTitle(""); setUsername(""); setPassword(""); setUrl("");
    setTotp(""); setNotes(""); setCardNumber(""); setCardExpiry(""); setCardHolder("");
    setShowPw(false); setShowGen(false); setTotpError(null); setTotpCode("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (totp.trim()) {
      const err = validateTotpSecret(totp);
      if (err) { setTotpError(err); return; }
    }
    if (cat === "totp") {
      const err = validateTotpSecret(totp);
      if (err) { setTotpError(err); return; }
    }
    onAdd({
      category: cat,
      title: title.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
      url: url.trim() || undefined,
      totp: totp.trim() || undefined,
      notes: notes.trim() || undefined,
      cardNumber: cardNumber.trim() || undefined,
      cardExpiry: cardExpiry.trim() || undefined,
      cardHolder: cardHolder.trim() || undefined,
    });
    reset();
    onClose();
  };

  const copyTotpCode = () => {
    if (!totpCode) return;
    navigator.clipboard.writeText(totpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const activeTab = TABS.find(t => t.id === cat)!;

  const inputCls = "w-full h-11 bg-parchment dark:bg-background border border-border-cream dark:border-white/10 rounded-xl px-4 text-[14px] text-near-black dark:text-white outline-none focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta/40 transition-all font-medium placeholder:text-stone/40";

  return (
    <div
      data-theme={theme}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-all duration-300"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-ivory dark:bg-card w-full max-w-[540px] max-h-[90vh] flex flex-col rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.7)] border border-border-cream dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-[22px] font-bold text-near-black dark:text-white leading-tight tracking-tight">
                New {activeTab.label}
              </h2>
              <p className="text-[13px] text-stone dark:text-silver/60 mt-1 font-medium leading-relaxed">{activeTab.desc}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-stone dark:text-silver/70 hover:bg-border-light dark:hover:bg-muted hover:text-charcoal dark:hover:text-white transition-all ml-4 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Underline tab bar */}
        <div className="px-7 border-b border-border-cream dark:border-white/[0.06] flex gap-2 -mb-px">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = cat === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setCat(t.id)}
                className={`relative flex items-center gap-2 px-3 py-3.5 text-[12.5px] font-bold transition-all border-b-2 -mb-px tracking-tight uppercase ${active
                    ? "text-terracotta border-terracotta"
                    : "text-stone/60 dark:text-silver/40 border-transparent hover:text-charcoal dark:hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto scrollbar-warm">
          <form onSubmit={submit} className="px-7 py-6 space-y-6">

            {/* Title is shared across all */}
            <FormField label="Title" required>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GitHub, Netflix, Bank"
                className={`${inputCls} font-sans`}
              />
            </FormField>

            {cat === "password" && (
              <>
                <FormField label="Username / Email">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user@example.com"
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Password">
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`${inputCls} font-mono tracking-wide text-[14px] pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone dark:text-silver/70 hover:text-charcoal dark:hover:text-white transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2.5">
                      <PasswordStrength strength={assessStrength(password)} showBar />
                    </div>
                  )}
                </FormField>

                {/* Generator toggle */}
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowGen(s => !s)}
                    className="flex items-center gap-2 text-[11px] text-terracotta hover:text-coral font-bold uppercase tracking-widest transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {showGen ? "Hide" : "Generate"} password
                  </button>

                  {showGen && (
                    <div className="p-5 bg-parchment/60 dark:bg-background/50 border border-border-cream dark:border-white/[0.06] rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200">
                      <PasswordGenerator
                        onUse={(p) => { setPassword(p); setShowPw(true); setShowGen(false); }}
                        initialPassword={password}
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-border-cream dark:border-white/[0.06] pt-1" />

                <FormField label="Website / URL">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={inputCls}
                  />
                </FormField>
              </>
            )}

            {cat === "card" && (
              <>
                <FormField label="Card Number">
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className={`${inputCls} font-mono tracking-wider text-[15px]`}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-5">
                  <FormField label="Expiry">
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Cardholder">
                    <input
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Full name"
                      className={inputCls}
                    />
                  </FormField>
                </div>
              </>
            )}

            {cat === "totp" && (
              <>
                <FormField label="Account Name">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username or email"
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Secret Key" required>
                  <div className="relative">
                    <input
                      value={totp}
                      onChange={(e) => {
                        setTotp(e.target.value);
                        setTotpError(e.target.value.trim() ? validateTotpSecret(e.target.value) : null);
                      }}
                      placeholder="JBSWY3DPEHPK3PXP"
                      className={`${inputCls} font-mono tracking-widest text-[14px] pr-10 ${totpError ? "border-red-400 focus:ring-red-100/30" :
                          totp && !totpError ? "border-emerald-400 focus:ring-emerald-100/30" : ""
                        }`}
                    />
                    {totp && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {totpError
                          ? <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                          : <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                        }
                      </span>
                    )}
                  </div>
                  {totpError && (
                    <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5 mt-2 uppercase tracking-wide">
                      <AlertTriangle className="w-3.5 h-3.5" /> {totpError}
                    </p>
                  )}
                </FormField>

                {/* Live TOTP preview */}
                {totpCode && !totpError && (
                  <div className="bg-parchment dark:bg-background border border-border-cream dark:border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between animate-in fade-in duration-200 shadow-sm">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone/50 dark:text-silver/50 mb-1.5">Live Preview</div>
                      <div className="font-mono text-[26px] font-bold text-near-black dark:text-white tracking-[0.2em]">
                        {totpCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyTotpCode}
                      className="w-11 h-11 flex items-center justify-center rounded-xl text-stone dark:text-silver/70 hover:bg-border-light dark:hover:bg-muted hover:text-terracotta transition-all border border-transparent hover:border-terracotta/20"
                    >
                      {copied ? <Check className="w-5 h-5 text-terracotta" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="border-t border-border-cream dark:border-white/[0.06] pt-1" />

            {/* Notes */}
            <FormField label={cat === "note" ? "Note Content" : "Notes"}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={cat === "note" ? "Write your note here…" : "Add any extra details, hints, etc."}
                rows={cat === "note" ? 8 : 4}
                className={`w-full bg-parchment dark:bg-background border border-border-cream dark:border-white/10 rounded-xl px-4 py-3 text-[14px] text-near-black dark:text-white outline-none focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta/40 transition-all font-medium placeholder:text-stone/40 resize-none leading-relaxed`}
              />
            </FormField>

          </form>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-border-cream dark:border-white/[0.06] flex items-center justify-between bg-ivory dark:bg-card flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border border-border-cream dark:border-white/10 text-stone dark:text-white/70 text-[14px] font-bold hover:bg-border-light dark:hover:bg-muted transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-11 px-8 rounded-xl bg-terracotta text-white text-[14px] font-bold flex items-center gap-2 hover:bg-coral hover:-translate-y-0.5 transition-all shadow-[0_6px_20px_rgba(201,100,66,0.25)] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create {activeTab.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-stone dark:text-silver/60 ml-0.5">
        {label}{required && <span className="text-terracotta ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
