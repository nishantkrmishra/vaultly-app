/**
 * ChangeMasterPasswordModal.tsx
 * Full re-encryption flow with progress feedback.
 */

import { useState } from "react";
import { X, Eye, EyeOff, ShieldCheck, Loader2, AlertTriangle, Check } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { assessStrength } from "@/lib/vault-types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangeMasterPasswordModal({ open, onClose }: Props) {
  const { changeMasterPassword } = useAuth();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const strength = assessStrength(newPw);
  const match = newPw === confirmPw;
  const canSubmit = oldPw && newPw.length >= 8 && match && !loading;

  const strengthColors = { weak: "bg-red-500", medium: "bg-amber-400", strong: "bg-emerald-500" };
  const strengthWidths = { weak: "w-1/3", medium: "w-2/3", strong: "w-full" };

  const handleClose = () => {
    if (loading) return;
    setOldPw(""); setNewPw(""); setConfirmPw("");
    setError(""); setDone(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const ok = await changeMasterPassword(oldPw, newPw);
      if (ok) {
        setDone(true);
        setOldPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setError("Current password is incorrect.");
      }
    } catch {
      setError("Re-encryption failed. No data was changed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputClass = "w-full bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl px-4 py-3 pr-11 text-[14px] text-near-black dark:text-white outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[12px]"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-ivory dark:bg-[#1a1a1a] w-full max-w-[480px] rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-border-cream dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-cream dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-near-black dark:text-white">Change master password</h2>
            <p className="text-[13px] text-stone dark:text-silver/80 mt-0.5">All vault items will be re-encrypted with the new password.</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone hover:bg-border-light dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {done ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-4">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-serif text-[20px] font-semibold text-near-black dark:text-white mb-2">Password changed!</h3>
              <p className="text-[13px] text-stone dark:text-silver/80">All items have been re-encrypted with your new master password.</p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 rounded-xl bg-terracotta text-white text-[14px] font-bold hover:bg-coral transition-all shadow-[0_4px_12px_rgba(201,100,66,0.25)]"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80">Current password</label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPw}
                    onChange={(e) => { setOldPw(e.target.value); setError(""); }}
                    autoFocus
                    placeholder="Your current master password"
                    className={inputClass}
                  />
                  <button type="button" onClick={() => setShowOld(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal dark:hover:text-white transition-colors">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                  <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal dark:hover:text-white transition-colors">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPw && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-border-cream dark:bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${strengthColors[strength]} ${strengthWidths[strength]}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className={`${inputClass} ${confirmPw && !match ? "border-red-400 focus:ring-red-200" : confirmPw && match ? "border-emerald-400 focus:ring-emerald-200" : ""}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal dark:hover:text-white transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPw && !match && <p className="text-[11px] text-red-500 font-medium">Passwords don't match</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Re-encryption notice */}
              {!error && (
                <div className="flex items-start gap-2 bg-terracotta/5 border border-terracotta/15 rounded-xl px-3 py-2.5">
                  <ShieldCheck className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-stone dark:text-silver/80 leading-relaxed">
                    All vault items will be decrypted with the old key and immediately re-encrypted with the new key. This is done entirely in your browser — nothing is sent anywhere.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-border-cream dark:border-white/10 text-[14px] font-medium text-charcoal dark:text-white hover:bg-border-light dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-[14px] font-bold hover:bg-coral transition-all shadow-[0_4px_12px_rgba(201,100,66,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Re-encrypting…
                    </>
                  ) : (
                    "Change password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
