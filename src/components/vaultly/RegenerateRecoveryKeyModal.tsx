/**
 * RegenerateRecoveryKeyModal.tsx
 * Lets the user generate a new recovery key from Settings.
 * Requires password confirmation, shows the key once, gates Continue.
 */

import { useState } from "react";
import { X, Eye, EyeOff, AlertTriangle, Copy, Check, Download, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Stage = "warn" | "confirm_pw" | "show_key";

export function RegenerateRecoveryKeyModal({ open, onClose }: Props) {
  const { regenerateRecoveryKey, confirmRecoveryKey } = useAuth();
  const [stage, setStage]           = useState<Stage>("warn");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pwError, setPwError]       = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [hasCopied, setHasCopied]   = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);

  const savedAction = hasCopied || hasDownloaded;
  const canFinish   = savedAction && confirmedSaved;

  const handleClose = () => {
    if (stage === "show_key" && !canFinish) {
      toast.warning("Please save your recovery key before closing.");
      return;
    }
    setStage("warn"); setPassword(""); setPwError(""); setRecoveryKey("");
    setHasCopied(false); setHasDownloaded(false); setConfirmedSaved(false);
    onClose();
  };

  const handleGenerate = async () => {
    if (!password) return;
    setGenerating(true);
    setPwError("");
    try {
      const key = await regenerateRecoveryKey(password);
      if (!key) {
        setPwError("Incorrect password. Please try again.");
        return;
      }
      setRecoveryKey(key);
      setStage("show_key");
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setHasCopied(true); setCopiedFlash(true);
    toast.success("Recovery key copied");
    setTimeout(() => setCopiedFlash(false), 1800);
  };

  const downloadKey = () => {
    const txt = [`Vaultly Recovery Key`, `Generated: ${new Date().toISOString()}`, ``, `Key: ${recoveryKey}`, ``, `Store this securely. Never share it.`].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "vaultly-recovery-key.txt";
    a.click();
    setHasDownloaded(true);
    toast.success("Recovery key downloaded");
  };

  const handleFinish = async () => {
    if (!canFinish) return;
    try { await confirmRecoveryKey(); } catch { /* non-critical */ }
    toast.success("Recovery key updated successfully");
    handleClose();
  };

  if (!open) return null;

  const inputClass = "w-full bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl px-4 py-3 pr-11 text-[14px] text-near-black dark:text-white outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[12px]" onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-ivory dark:bg-[#1a1a1a] w-full max-w-[480px] rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-border-cream dark:border-white/5">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-cream dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-[20px] font-semibold text-near-black dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-terracotta" />
              {stage === "show_key" ? "Your new recovery key" : "Regenerate recovery key"}
            </h2>
            <p className="text-[13px] text-stone dark:text-silver/80 mt-0.5">
              {stage === "show_key" ? "Save this key before continuing — shown once only." : "This will invalidate your current recovery key."}
            </p>
          </div>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone hover:bg-border-light dark:hover:bg-white/5 transition-colors ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── Stage: Warning ── */}
          {stage === "warn" && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-[13px]">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">This will invalidate your old recovery key</p>
                  <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                    After regenerating, your existing recovery key file will no longer work.
                    You will need to save and store the new key immediately.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-border-cream dark:border-white/10 text-[14px] font-medium text-charcoal dark:text-white hover:bg-border-light dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setStage("confirm_pw")} className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-[14px] font-bold hover:bg-coral transition-all shadow-[0_4px_12px_rgba(201,100,66,0.25)]">
                  I understand, continue
                </button>
              </div>
            </div>
          )}

          {/* ── Stage: Confirm Password ── */}
          {stage === "confirm_pw" && (
            <div className="space-y-4">
              <p className="text-[13px] text-stone dark:text-silver/80">Confirm your master password to generate a new recovery key.</p>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError(""); }}
                  autoFocus
                  placeholder="Master password"
                  className={`${inputClass} ${pwError ? "border-red-400" : ""}`}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal dark:hover:text-white transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwError && (
                <div className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />{pwError}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStage("warn")} className="flex-1 py-2.5 rounded-xl border border-border-cream dark:border-white/10 text-[14px] font-medium text-charcoal dark:text-white hover:bg-border-light dark:hover:bg-white/5 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!password || generating}
                  className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-[14px] font-bold hover:bg-coral transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_12px_rgba(201,100,66,0.25)]"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : "Generate key"}
                </button>
              </div>
            </div>
          )}

          {/* ── Stage: Show New Key ── */}
          {stage === "show_key" && (
            <div className="space-y-4">
              {/* Key display */}
              <div className="bg-parchment dark:bg-[#0f0f0f] border-2 border-terracotta/25 rounded-xl px-5 py-4 select-all cursor-text">
                <div className="font-mono text-[16px] font-bold text-near-black dark:text-white tracking-wider text-center break-all leading-relaxed">
                  {recoveryKey.split("-").map((seg, i) => (
                    <span key={i}>{i > 0 && <span className="text-stone/40 mx-1">–</span>}{seg}</span>
                  ))}
                </div>
              </div>

              {/* Copy/Download */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={copyKey} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${hasCopied ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border-cream dark:border-white/10 bg-parchment dark:bg-[#0f0f0f] text-charcoal dark:text-white hover:border-terracotta/40 hover:text-terracotta"}`}>
                  {copiedFlash ? <><Check className="w-4 h-4" />Copied!</> : hasCopied ? <><Check className="w-4 h-4" />Copied ✓</> : <><Copy className="w-4 h-4" />Copy key</>}
                </button>
                <button onClick={downloadKey} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${hasDownloaded ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border-cream dark:border-white/10 bg-parchment dark:bg-[#0f0f0f] text-charcoal dark:text-white hover:border-terracotta/40 hover:text-terracotta"}`}>
                  {hasDownloaded ? <><Check className="w-4 h-4" />Downloaded ✓</> : <><Download className="w-4 h-4" />Download .txt</>}
                </button>
              </div>

              {/* Status / warning */}
              {!savedAction ? (
                <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-[12px] text-amber-700 dark:text-amber-400">Copy or download this key — you cannot view it again.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-[12px] text-emerald-700 dark:text-emerald-400">Key saved. Check the box below to confirm.</p>
                </div>
              )}

              {/* Confirmation checkbox */}
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all ${confirmedSaved ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10" : "border-border-cream dark:border-white/10 bg-parchment dark:bg-[#0f0f0f]"} ${!savedAction ? "opacity-50 pointer-events-none" : ""}`}>
                <input type="checkbox" checked={confirmedSaved} onChange={(e) => setConfirmedSaved(e.target.checked)} disabled={!savedAction} className="mt-0.5 w-4 h-4 accent-terracotta flex-shrink-0" />
                <span className={`text-[13px] ${confirmedSaved ? "text-emerald-800 dark:text-emerald-300 font-medium" : "text-charcoal dark:text-white"}`}>
                  I have saved my new recovery key securely
                </span>
              </label>

              <button onClick={handleFinish} disabled={!canFinish}
                className={`w-full py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${canFinish ? "bg-terracotta text-white hover:bg-coral shadow-[0_4px_12px_rgba(201,100,66,0.25)] active:scale-[0.98]" : "bg-border-cream dark:bg-white/5 text-stone dark:text-silver/40 cursor-not-allowed"}`}>
                <ShieldCheck className="w-4 h-4" />
                {canFinish ? "Done — key saved" : !savedAction ? "Copy or download first" : "Check the box above"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
