import { useEffect, useState, useRef, useCallback } from "react";
import { X, Eye, EyeOff, QrCode, Copy, Trash2, Pencil, ExternalLink, Sparkles, Plus, Check, RefreshCw, History, RotateCcw, Timer } from "lucide-react";
import { PasswordStrength } from "./PasswordStrength";
import type { VaultItem } from "@/lib/vault-types";
import { assessStrength, categoryLabels } from "@/lib/vault-types";
import { generateTOTP, getSecondsLeft } from "@/lib/totp";
import { faviconFor, domainOf, extractServiceName } from "@/lib/favicon";
import { PasswordGenerator } from "./PasswordGenerator";

/** Auto-hide password after this many milliseconds once revealed */
const PW_AUTO_HIDE_MS = 15_000;
/** Auto-clear clipboard after this many milliseconds after copying */
const CLIPBOARD_CLEAR_MS = 30_000;

interface Props {
  item: VaultItem | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<VaultItem>) => void;
  onDelete: (id: string) => void;
  theme?: "light" | "dark";
}

export function ItemDetailDialog({ item, onClose, onSave, onDelete, theme }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VaultItem | null>(item);
  const [showPw, setShowPw] = useState(false);
  const [pwAutoHideSecsLeft, setPwAutoHideSecsLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [showGen, setShowGen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [revealedHistoryIdx, setRevealedHistoryIdx] = useState<number | null>(null);
  const [iconError, setIconError] = useState(false);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(item);
    setEditing(false);
    setShowPw(false);
    setPwAutoHideSecsLeft(null);
    setShowGen(false);
    setShowHistory(false);
    setRevealedHistoryIdx(null);
    setIconError(false);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (autoHideIntervalRef.current) clearInterval(autoHideIntervalRef.current);
    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  useEffect(() => {
    if (!item?.totp) return;
    const tick = () => {
      const { code: c, secondsLeft: s } = generateTOTP(item.totp!);
      setCode(c);
      setSecondsLeft(s);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [item?.id, item?.totp]);

  /** Start 15-second countdown then hide password */
  const togglePasswordVisibility = useCallback(() => {
    if (showPw) {
      // Hide immediately
      setShowPw(false);
      setPwAutoHideSecsLeft(null);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (autoHideIntervalRef.current) clearInterval(autoHideIntervalRef.current);
    } else {
      // Show and start auto-hide countdown
      setShowPw(true);
      setPwAutoHideSecsLeft(Math.ceil(PW_AUTO_HIDE_MS / 1000));
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (autoHideIntervalRef.current) clearInterval(autoHideIntervalRef.current);
      autoHideIntervalRef.current = setInterval(() => {
        setPwAutoHideSecsLeft((s) => {
          if (s === null || s <= 1) return null;
          return s - 1;
        });
      }, 1000);
      autoHideTimerRef.current = setTimeout(() => {
        setShowPw(false);
        setPwAutoHideSecsLeft(null);
        if (autoHideIntervalRef.current) clearInterval(autoHideIntervalRef.current);
      }, PW_AUTO_HIDE_MS);
    }
  }, [showPw]);

  if (!item || !draft) return null;

  /** Copy to clipboard and schedule auto-clear after 30s */
  const copy = (label: string, val?: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
    // Auto-clear clipboard after 30 seconds
    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    clipboardTimerRef.current = setTimeout(() => {
      navigator.clipboard.writeText("").catch(() => { });
    }, CLIPBOARD_CLEAR_MS);
  };

  const useGeneratedPw = (p: string) => {
    setDraft({ ...draft, password: p });
    setShowPw(true);
    setShowGen(false);
  };

  const restorePassword = (oldPw: string) => {
    if (!draft) return;
    setDraft({ ...draft, password: oldPw });
    setShowPw(true);
    if (!editing) {
      onSave(item.id, { password: oldPw });
    }
  };

  const fmtAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const save = () => {
    onSave(item.id, draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(item);
    setEditing(false);
  };

  const favicon = faviconFor(item);
  const domain = domainOf(item.url);
  const strength = item.password ? assessStrength(item.password) : null;

  return (
  return (
    <div
      data-theme={theme}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-ivory dark:bg-card w-full max-w-[560px] max-h-[92vh] flex flex-col rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.7)] border border-border-cream dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Hero header - Fixed */}
        <div className="px-8 pt-8 pb-7 border-b border-border-cream dark:border-white/5 relative bg-ivory dark:bg-card z-10 shadow-sm">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-11 h-11 flex items-center justify-center rounded-xl text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-charcoal dark:hover:text-white transition-all"
          >
            <X className="w-5.5 h-5.5" />
          </button>

          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden border border-border-cream dark:border-white/10 shadow-sm"
              style={{ background: item.bgColor }}
            >
              {favicon && !iconError ? (
                <img
                  src={favicon}
                  alt=""
                  className="w-11 h-11 object-contain"
                  onError={() => setIconError(true)}
                />
              ) : item.emoji ? (
                <span className="text-3xl">{item.emoji}</span>
              ) : (
                <span className="text-white font-bold uppercase text-[32px]">
                  {item.title.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full font-serif text-[28px] font-bold text-near-black dark:text-white bg-transparent border-b-2 border-terracotta/30 focus:border-terracotta outline-none pb-1 transition-colors"
                />
              ) : (
                <h1 className="font-serif text-[32px] font-bold text-near-black dark:text-white leading-tight tracking-tight truncate">{item.title}</h1>
              )}
              <div className="flex items-center gap-2.5 mt-2.5">
                {/* Category badge */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta shadow-[0_0_8px_rgba(201,100,66,0.5)]" />
                  {categoryLabels[item.category]}
                </span>
                {domain && (
                  <span className="text-[12.5px] text-stone dark:text-silver/60 truncate font-medium">{domain}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto scrollbar-warm pr-1 custom-scrollbar-container">
          <div className="px-8 py-7 space-y-7">
            {/* Block: Identity & Service */}
            <div className="space-y-5">
              <FieldRow
                label="Website"
                value={draft.url || ""}
                editing={editing}
                onChange={(v) => {
                  const newDraft = { ...draft, url: v };
                  if (editing && (!draft.title || draft.title === "Untitled")) {
                    const service = extractServiceName(v);
                    if (service) newDraft.title = service;
                  }
                  setDraft(newDraft);
                }}
                onCopy={() => copy("url", draft.url)}
                copied={copied === "url"}
                placeholder="https://"
                rightExtra={
                  !editing && draft.url ? (
                    <a
                      href={draft.url.startsWith("http") ? draft.url : `https://${draft.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-11 h-11 flex items-center justify-center rounded-xl text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-terracotta transition-all"
                      title="Open"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null
                }
              />
              {(draft.customIconUrl || editing) && (
                <FieldRow
                  label="Custom Icon URL"
                  value={draft.customIconUrl || ""}
                  editing={editing}
                  onChange={(v) => setDraft({ ...draft, customIconUrl: v })}
                  onCopy={() => copy("icon", draft.customIconUrl)}
                  copied={copied === "icon"}
                  placeholder="https://example.com/favicon.ico"
                />
              )}
            </div>

            <div className="border-t border-border-cream dark:border-white/5 pt-2" />

            {/* Block: Security & Credentials */}
            <div className="space-y-5">
              {item.category === "password" && (
                <>
                  <FieldRow
                    label="Username"
                    value={draft.username || ""}
                    editing={editing}
                    onChange={(v) => setDraft({ ...draft, username: v })}
                    onCopy={() => copy("user", draft.username)}
                    copied={copied === "user"}
                    placeholder="user@example.com"
                  />
                  <FieldRow
                    label="Password"
                    value={draft.password || ""}
                    editing={editing}
                    onChange={(v) => setDraft({ ...draft, password: v })}
                    onCopy={() => copy("pw", draft.password)}
                    copied={copied === "pw"}
                    masked={!showPw}
                    onToggleMask={togglePasswordVisibility}
                    mono
                    rightExtra={null}
                    belowExtra={
                      <>
                        {strength && !editing ? (
                          <div className="mt-3 flex items-center gap-4 flex-wrap">
                            <PasswordStrength strength={strength} />
                            <span className="text-[11px] text-stone dark:text-silver/50 font-bold uppercase tracking-wider">{(draft.password || "").length} chars</span>
                            {showPw && pwAutoHideSecsLeft !== null && (
                              <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                                <Timer className="w-3.5 h-3.5" />
                                Hides in {pwAutoHideSecsLeft}s
                              </span>
                            )}
                          </div>
                        ) : null}
                        {editing && draft.password && (
                          <div className="mt-3">
                            <PasswordStrength strength={assessStrength(draft.password)} showBar={true} />
                          </div>
                        )}
                        {editing && (
                          <div className="mt-4 space-y-4">
                            <button
                              type="button"
                              onClick={() => setShowGen((s) => !s)}
                              className="px-2 py-1 -ml-2 rounded-md text-[11px] text-terracotta hover:text-coral hover:bg-terracotta/5 font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4" /> {showGen ? "Hide" : "Open"} password generator
                            </button>

                            {showGen && (
                              <div className="p-5 bg-parchment/50 dark:bg-background/40 border border-border-cream dark:border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <PasswordGenerator onUse={useGeneratedPw} initialPassword={draft.password} />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    }
                  />
                  {(draft.totp || editing) && (
                    <FieldRow
                      label="Authenticator (TOTP)"
                      value={draft.totp || ""}
                      editing={editing}
                      onChange={(v) => setDraft({ ...draft, totp: v })}
                      onCopy={() => copy("totp-secret", draft.totp)}
                      copied={copied === "totp-secret"}
                      placeholder="Setup key"
                      masked={!editing}
                    />
                  )}
                  {item.totp && !editing && code && (
                    <div className="bg-parchment dark:bg-background border border-border-cream dark:border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone dark:text-silver/60 mb-1.5">Current code</div>
                        <div className="font-mono text-[26px] font-bold text-near-black dark:text-white tracking-[0.2em]">{code}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11">
                          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-border-cream dark:text-white/5" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
                              stroke="currentColor" className="text-terracotta" strokeWidth="3" strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 1s linear' }}
                              strokeDasharray={`${(secondsLeft / 30) * 94.2} 94.2`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-charcoal dark:text-silver/70">
                            {secondsLeft}
                          </div>
                        </div>
                        <button
                          onClick={() => copy("totp", code.replace(" ", ""))}
                          className="w-11 h-11 flex items-center justify-center rounded-xl text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-terracotta transition-all"
                        >
                          {copied === "totp" ? <Check className="w-5 h-5 text-terracotta" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password history */}
                  <div className="bg-parchment dark:bg-background border border-border-cream dark:border-white/5 rounded-2xl overflow-hidden mt-2 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setShowHistory((s) => !s)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-ivory/50 dark:hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <History className="w-4 h-4 text-stone/60 dark:text-silver/60" />
                        <span className="text-[13.5px] font-bold text-charcoal dark:text-white/90">Password history</span>
                        <span className="text-[11px] font-bold text-stone/50 dark:text-silver/40">
                          ({(item.passwordHistory || []).length})
                        </span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-stone/60 dark:text-silver/40">{showHistory ? "Hide" : "Show"}</span>
                    </button>
                    {showHistory && (
                      <div className="border-t border-border-cream dark:border-white/5 px-5 py-4 space-y-3 max-h-[220px] overflow-y-auto scrollbar-warm">
                        {(item.passwordHistory || []).length === 0 ? (
                          <div className="text-[12.5px] text-stone dark:text-silver/50 italic py-4 text-center font-medium">
                            No previous passwords yet.
                          </div>
                        ) : (
                          (item.passwordHistory || []).map((h, idx) => {
                            const revealed = revealedHistoryIdx === idx;
                            return (
                              <div
                                key={idx}
                                className="bg-ivory dark:bg-card border border-border-cream dark:border-white/5 rounded-xl pl-4 pr-2 py-3 flex items-center gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-[13px] font-bold text-near-black dark:text-white truncate tracking-wider">
                                    {revealed ? h.password : "•".repeat(Math.min(h.password.length, 18))}
                                  </div>
                                  <div className="text-[11px] text-stone/60 dark:text-silver/50 mt-1 font-medium">
                                    Changed {fmtAgo(h.changedAt)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setRevealedHistoryIdx(revealed ? null : idx)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-charcoal dark:hover:text-white transition-all"
                                    title={revealed ? "Hide" : "Show"}
                                  >
                                    {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(h.password);
                                      setCopied(`hist-${idx}`);
                                      setTimeout(() => setCopied(null), 1200);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-charcoal dark:hover:text-white transition-all"
                                    title="Copy"
                                  >
                                    {copied === `hist-${idx}` ? (
                                      <Check className="w-4 h-4 text-terracotta" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm("Restore this password as the current one?")) {
                                        restorePassword(h.password);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-terracotta hover:bg-terracotta/10 transition-all flex items-center gap-1.5"
                                    title="Restore"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Restore
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {item.category === "card" && (
                <>
                  <FieldRow
                    label="Card number"
                    value={draft.cardNumber || ""}
                    editing={editing}
                    onChange={(v) => setDraft({ ...draft, cardNumber: v })}
                    onCopy={() => copy("cn", draft.cardNumber)}
                    copied={copied === "cn"}
                    masked={!showPw}
                    onToggleMask={() => setShowPw((s) => !s)}
                    mono
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FieldRow
                      label="Expiry"
                      value={draft.cardExpiry || ""}
                      editing={editing}
                      onChange={(v) => setDraft({ ...draft, cardExpiry: v })}
                      onCopy={() => copy("exp", draft.cardExpiry)}
                      copied={copied === "exp"}
                      placeholder="MM/YY"
                    />
                    <FieldRow
                      label="Cardholder"
                      value={draft.cardHolder || ""}
                      editing={editing}
                      onChange={(v) => setDraft({ ...draft, cardHolder: v })}
                      onCopy={() => copy("ch", draft.cardHolder)}
                      copied={copied === "ch"}
                    />
                  </div>
                </>
              )}

              {item.category === "totp" && (
                <>
                  <FieldRow
                    label="Account"
                    value={draft.username || ""}
                    editing={editing}
                    onChange={(v) => setDraft({ ...draft, username: v })}
                    onCopy={() => copy("user", draft.username)}
                    copied={copied === "user"}
                  />
                  <FieldRow
                    label="Secret key"
                    value={draft.totp || ""}
                    editing={editing}
                    onChange={(v) => setDraft({ ...draft, totp: v })}
                    onCopy={() => copy("secret", draft.totp)}
                    copied={copied === "secret"}
                    masked={!editing}
                    mono
                    rightExtra={null}
                  />
                  {item.totp && !editing && code && (
                    <div className="bg-parchment dark:bg-background border border-border-cream dark:border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone dark:text-silver/60 mb-1.5">Current code</div>
                        <div className="font-mono text-[26px] font-bold text-near-black dark:text-white tracking-[0.2em]">{code}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11">
                          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-border-cream dark:text-white/5" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
                              stroke="currentColor" className="text-terracotta" strokeWidth="3" strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 1s linear' }}
                              strokeDasharray={`${(secondsLeft / 30) * 94.2} 94.2`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-charcoal dark:text-silver/70">
                            {secondsLeft}
                          </div>
                        </div>
                        <button
                          onClick={() => copy("totp", code.replace(" ", ""))}
                          className="w-11 h-11 flex items-center justify-center rounded-xl text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-terracotta transition-all"
                        >
                          {copied === "totp" ? <Check className="w-5 h-5 text-terracotta" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-border-cream dark:border-white/5 pt-2" />

            {/* Block: Metadata & Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-stone/60 dark:text-silver/60 mb-2 ml-0.5">Secure Notes</label>
                {editing ? (
                  <textarea
                    value={draft.notes || ""}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    rows={6}
                    className="w-full bg-parchment dark:bg-background border border-border-cream dark:border-white/10 rounded-2xl px-5 py-4 text-[14px] font-medium text-near-black dark:text-white outline-none focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta/40 transition-all resize-none leading-relaxed placeholder:text-stone/40"
                    placeholder="Add any extra details..."
                  />
                ) : (
                  <div className="bg-parchment dark:bg-background border border-border-cream dark:border-white/5 rounded-2xl px-5 py-4 text-[14px] text-charcoal/90 dark:text-white/80 min-h-[100px] whitespace-pre-wrap leading-relaxed font-medium shadow-sm">
                    {draft.notes || <span className="text-stone/40 dark:text-silver/40 italic">No notes added yet</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-border-cream dark:border-white/[0.06] flex items-center justify-between sticky bottom-0 bg-ivory dark:bg-card z-20 flex-shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
            {editing ? (
              <>
                <button
                  onClick={cancel}
                  className="h-11 px-6 rounded-xl border border-border-cream dark:border-white/10 text-stone dark:text-white/70 text-[14px] font-bold hover:bg-border-light dark:hover:bg-muted transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="h-11 px-8 rounded-xl bg-terracotta text-white text-[14px] font-bold hover:bg-coral hover:-translate-y-0.5 transition-all shadow-[0_6px_20px_rgba(201,100,66,0.25)] active:scale-[0.98]"
                >
                  Save changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (confirm("Delete this item? This cannot be undone.")) {
                      onDelete(item.id);
                      onClose();
                    }
                  }}
                  className="h-11 px-5 rounded-xl text-[13px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="h-11 px-8 rounded-xl bg-near-black dark:bg-[#252422] text-white text-[14px] font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-[0.98]"
                >
                  <Pencil className="w-4 h-4" /> Edit Item
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label, value, editing, onChange, onCopy, copied,
  masked, onToggleMask, placeholder, rightExtra, belowExtra, mono,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  onCopy: () => void;
  copied: boolean;
  masked?: boolean;
  onToggleMask?: () => void;
  placeholder?: string;
  rightExtra?: React.ReactNode;
  belowExtra?: React.ReactNode;
  mono?: boolean;
}) {
  const display = masked && value ? "•".repeat(Math.min(value.length, 14)) : value;
  return (
    <div className="space-y-2.5">
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-stone/60 dark:text-silver/60 ml-0.5">{label}</label>
      <div className="bg-parchment dark:bg-background border border-border-cream dark:border-white/10 rounded-xl pl-5 pr-1.5 py-1.5 flex items-center gap-2 focus-within:ring-4 focus-within:ring-terracotta/5 focus-within:border-terracotta/40 transition-all shadow-sm">
        {editing ? (
          <input
            type={masked && onToggleMask ? (masked ? "password" : "text") : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent outline-none py-2 text-[14px] text-near-black dark:text-white font-medium ${mono ? "font-mono font-bold tracking-wide" : ""}`}
          />
        ) : (
          <div className={`flex-1 py-2 text-[14px] text-near-black dark:text-white truncate font-semibold ${mono ? "font-mono tracking-wide" : ""} ${!value ? "text-stone/40 italic font-medium" : ""}`}>
            {value ? display : "—"}
          </div>
        )}
        <div className="flex items-center gap-1">
          {onToggleMask && value && (
            <button
              type="button"
              onClick={onToggleMask}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-terracotta transition-all"
              title={masked ? "Show" : "Hide"}
            >
              {masked ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
            </button>
          )}
          {rightExtra}
          {value && !editing && (
            <button
              type="button"
              onClick={onCopy}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-stone dark:text-silver/80 hover:bg-border-light dark:hover:bg-muted hover:text-charcoal dark:hover:text-white transition-all active:scale-95"
              title="Copy"
            >
              {copied ? <Check className="w-4.5 h-4.5 text-terracotta" /> : <Copy className="w-4.5 h-4.5" />}
            </button>
          )}
        </div>
      </div>
      {belowExtra}
    </div>
  );
}


