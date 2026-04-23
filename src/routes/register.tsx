import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, Lock, Loader2, Copy, Check, Download, AlertTriangle, LogIn } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { assessStrength } from "@/lib/vault-types";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Create Vault — Vaultly" }] }),
});

type Stage = "password" | "recovery";

function RegisterPage() {
  const { register, confirmRecoveryKey } = useAuth();
  const navigate = useNavigate();

  // ── Password stage state ────────────────────────────────────────────────
  const [stage, setStage]           = useState<Stage>("password");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // ── Recovery stage state ────────────────────────────────────────────────
  const [recoveryKey, setRecoveryKey]       = useState("");
  const [hasCopied, setHasCopied]           = useState(false);
  const [hasDownloaded, setHasDownloaded]   = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [copiedFlash, setCopiedFlash]       = useState(false);

  // Gate: user must have either copied OR downloaded, AND checked the box
  const savedAction   = hasCopied || hasDownloaded;
  const canContinue   = savedAction && confirmedSaved;

  const strength  = assessStrength(password);
  const match     = password === confirm;
  const canSubmit = password.length >= 8 && match && !loading;

  // ── Prevent accidental exit on recovery screen ──────────────────────────
  useEffect(() => {
    if (stage !== "recovery") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your recovery key will be lost. Are you sure you want to leave?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [stage]);

  const SC = { weak: "bg-red-500", medium: "bg-amber-400", strong: "bg-emerald-500" };
  const SL = { weak: "Weak — add symbols, numbers, uppercase", medium: "Medium — getting stronger", strong: "Strong — great password!" };
  const SW = { weak: "w-1/3", medium: "w-2/3", strong: "w-full" };

  // ── Submit password → generate vault + recovery key ─────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const key = await register(password);
      setRecoveryKey(key);
      setStage("recovery");
    } catch {
      setError("Failed to create vault. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Recovery actions ─────────────────────────────────────────────────────
  const copyKey = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setHasCopied(true);
    setCopiedFlash(true);
    toast.success("Recovery key copied to clipboard");
    setTimeout(() => setCopiedFlash(false), 1800);
  };

  const downloadKey = () => {
    const date = new Date().toISOString();
    const txt  = [
      "Vaultly Recovery Key",
      "====================",
      `Generated: ${date}`,
      "",
      `Key: ${recoveryKey}`,
      "",
      "Store this file securely. Anyone with this key can access your vault.",
      "Never share it. Keep multiple copies in different safe locations.",
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "vaultly-recovery-key.txt";
    a.click();
    setHasDownloaded(true);
    toast.success("Recovery key file downloaded");
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    try {
      await confirmRecoveryKey();
    } catch {
      // non-critical — metadata update failed, but vault is usable
    }
    navigate({ to: "/" });
  };

  // ── Shared styles ────────────────────────────────────────────────────────
  const inp = "w-full bg-parchment border border-border-cream rounded-xl px-4 py-3 pr-11 text-[14px] text-near-black outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 transition-all";

  // ── Recovery screen (full-screen, no card scroll) ────────────────────────
  if (stage === "recovery") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-terracotta/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="w-full max-w-[540px] relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-terracotta mb-3 shadow-[0_8px_32px_rgba(201,100,66,0.35)]">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-serif text-[26px] font-semibold text-near-black">Recovery Key</h1>
            <p className="text-[13px] text-stone mt-1">Shown <strong className="text-charcoal">exactly once</strong> — save it before continuing.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5 text-[12px]">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-stone line-through">Set password</span>
            <div className="flex-1 h-px bg-border-cream" />
            <div className="w-5 h-5 rounded-full bg-terracotta text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">2</div>
            <span className="font-semibold text-terracotta">Recovery key</span>
          </div>

          <div className="bg-ivory border border-border-cream rounded-2xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.08)] space-y-5">
            {/* Key display */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone mb-2">Your recovery key</p>
              <div className="bg-parchment border-2 border-terracotta/25 rounded-xl px-5 py-4 select-all cursor-text">
                <div className="font-mono text-[18px] font-bold text-near-black tracking-[0.12em] text-center break-all leading-relaxed">
                  {recoveryKey.split("-").map((seg, i) => (
                    <span key={i}>
                      {i > 0 && <span className="text-stone/40 mx-1">–</span>}
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-stone mt-1.5 text-center">Click to select all · 128-bit random key</p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={copyKey}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  hasCopied
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-border-cream bg-parchment text-charcoal hover:border-terracotta/40 hover:text-terracotta"
                }`}
              >
                {copiedFlash ? (
                  <><Check className="w-4 h-4" />Copied!</>
                ) : hasCopied ? (
                  <><Check className="w-4 h-4 text-emerald-600" />Copied ✓</>
                ) : (
                  <><Copy className="w-4 h-4" />Copy key</>
                )}
              </button>

              <button
                onClick={downloadKey}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  hasDownloaded
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-border-cream bg-parchment text-charcoal hover:border-terracotta/40 hover:text-terracotta"
                }`}
              >
                {hasDownloaded ? (
                  <><Check className="w-4 h-4 text-emerald-600" />Downloaded ✓</>
                ) : (
                  <><Download className="w-4 h-4" />Download .txt</>
                )}
              </button>
            </div>

            {/* Status hint */}
            {!savedAction && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  You must <strong>copy</strong> or <strong>download</strong> your key before continuing. This is shown only once.
                </p>
              </div>
            )}

            {savedAction && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-[12px] text-emerald-700">
                  Key saved. Now check the box below and continue to your vault.
                </p>
              </div>
            )}

            {/* Security warning */}
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 leading-relaxed">
                <strong>Never share this key.</strong> Anyone who has it can access your vault. Store it in a password manager or secure physical location.
              </p>
            </div>

            {/* Confirmation checkbox */}
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all ${confirmedSaved ? "border-emerald-300 bg-emerald-50" : "border-border-cream bg-parchment"}`}>
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
                disabled={!savedAction}
                className="mt-0.5 w-4 h-4 accent-terracotta flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className={`text-[13px] leading-snug ${confirmedSaved ? "text-emerald-800 font-medium" : "text-charcoal"} ${!savedAction ? "opacity-50" : ""}`}>
                I have safely saved my recovery key in a secure location and understand it cannot be recovered if lost
              </span>
            </label>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full py-3 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all ${
                canContinue
                  ? "bg-terracotta text-white hover:bg-coral shadow-[0_8px_20px_rgba(201,100,66,0.3)] active:scale-[0.98]"
                  : "bg-border-cream text-stone cursor-not-allowed"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              {canContinue ? "Open my vault" : !savedAction ? "Copy or download key first" : "Check the box above"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Password stage ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-terracotta/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-terracotta mb-4 shadow-[0_8px_32px_rgba(201,100,66,0.35)]">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-[30px] font-semibold text-near-black">Vaultly</h1>
          <p className="text-[13.5px] text-stone mt-1">Create your encrypted vault</p>
        </div>

        <div className="bg-ivory border border-border-cream rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="mb-5">
            <h2 className="font-serif text-[20px] font-semibold text-near-black">Set master password</h2>
            <p className="text-[13px] text-stone mt-1">This password encrypts everything and is never stored.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5 text-[12px]">
            <div className="w-5 h-5 rounded-full bg-terracotta text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">1</div>
            <span className="font-semibold text-terracotta">Set password</span>
            <div className="flex-1 h-px bg-border-cream" />
            <div className="w-5 h-5 rounded-full bg-border-cream text-stone flex items-center justify-center text-[11px] font-bold flex-shrink-0">2</div>
            <span className="text-stone">Recovery key</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Master password */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-stone">Master Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus placeholder="At least 8 characters" className={inp} />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-border-cream rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${SC[strength]} ${SW[strength]}`} />
                  </div>
                  <p className={`text-[11px] font-medium ${strength === "strong" ? "text-emerald-600" : strength === "medium" ? "text-amber-600" : "text-red-500"}`}>{SL[strength]}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-stone">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password"
                  className={`w-full bg-parchment border rounded-xl px-4 py-3 pr-11 text-[14px] text-near-black outline-none focus:ring-2 transition-all ${confirm && !match ? "border-red-400 focus:ring-red-200" : confirm && match ? "border-emerald-400 focus:ring-emerald-200" : "border-border-cream focus:ring-terracotta/20 focus:border-terracotta/50"}`} />
                <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && !match && <p className="text-[11px] text-red-500 font-medium">Passwords don't match</p>}
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600">{error}</div>}

            <button type="submit" disabled={!canSubmit}
              className="w-full py-3 rounded-xl bg-terracotta text-white font-bold text-[15px] flex items-center justify-center gap-2.5 hover:bg-coral transition-all shadow-[0_8px_20px_rgba(201,100,66,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Creating vault…</> : <><Lock className="w-5 h-5" />Continue →</>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border-cream space-y-3">
            <div className="flex items-start gap-2.5 text-[12px] text-stone">
              <ShieldCheck className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
              <span>AES-256-GCM encrypted · PBKDF2 (600,000 iterations) · Data never leaves your device</span>
            </div>
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] text-stone hover:text-terracotta transition-colors font-medium">
                <LogIn className="w-3.5 h-3.5" />
                Already have a vault? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
