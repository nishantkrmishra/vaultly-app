import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, Lock, Loader2, AlertTriangle, RotateCcw, KeyRound, Check, PlusCircle } from "lucide-react";
import { useAuth, type LoginStep } from "@/store/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Unlock Vault — Vaultly" }] }),
});

const STEPS: { key: LoginStep; label: string }[] = [
  { key: "verifying",  label: "Verifying password" },
  { key: "deriving",   label: "Deriving encryption key" },
  { key: "decrypting", label: "Decrypting vault data" },
  { key: "loading",    label: "Loading items" },
];

const ERROR_STEPS: LoginStep[] = ["error_wrong_password", "error_decryption", "error_corrupted"];

type Mode = "password" | "recovery" | "reset";

function LoginPage() {
  const { login, recover, reset, loginStep } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]         = useState<Mode>("password");
  const [password, setPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [attempts, setAttempts] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [firstLogin, setFirstLogin] = useState(false);

  const isError     = ERROR_STEPS.includes(loginStep);
  const isUnlocking = loading && !isError;
  const currentStepIdx = STEPS.findIndex((s) => s.key === loginStep);

  // Navigate to vault once unlocked; show backup reminder on first ever login
  useEffect(() => {
    if (loginStep === "done") {
      if (firstLogin) {
        setTimeout(() => {
          toast.warning("Back up your vault now — losing both your password and recovery key means permanent data loss.", {
            duration: 8000,
            id: "backup-reminder",
          });
        }, 1200);
      }
      navigate({ to: "/" });
    }
  }, [loginStep, navigate, firstLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = mode === "recovery" ? recoveryKey : password;
    if (!val || loading) return;
    setLoading(true);
    setError("");
    const wasFirstLogin = attempts === 0;
    try {
      const ok = mode === "recovery" ? await recover(val) : await login(val);
      if (ok) {
        setFirstLogin(wasFirstLogin);
      } else {
        const n = attempts + 1;
        setAttempts(n);
        setError(
          n >= 3
            ? "Incorrect password. Reset your vault below if you've forgotten it."
            : "Incorrect master password."
        );
        setPassword("");
        setRecoveryKey("");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try { await reset(); navigate({ to: "/register" }); }
    catch { setError("Reset failed."); setResetting(false); }
  };

  const card = "bg-ivory border border-border-cream rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]";
  const inp  = (err: boolean) =>
    `w-full bg-parchment border rounded-xl px-4 py-3 pr-11 text-[14px] text-near-black outline-none focus:ring-2 transition-all ${
      err ? "border-red-400 focus:ring-red-200" : "border-border-cream focus:ring-terracotta/20 focus:border-terracotta/50"
    }`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-terracotta/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-terracotta mb-4 shadow-[0_8px_32px_rgba(201,100,66,0.35)]">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-[30px] font-semibold text-near-black">Vaultly</h1>
          <p className="text-[13.5px] text-stone mt-1">Your vault is locked</p>
        </div>

        {/* ── Step-Based Unlock Loader ── */}
        {isUnlocking && (
          <div className={`${card} p-8`}>
            <h2 className="font-serif text-[20px] font-semibold text-near-black mb-6">Unlocking vault…</h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const isDone    = currentStepIdx > i;
                const isCurrent = currentStepIdx === i;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isDone ? "bg-emerald-500" : isCurrent ? "bg-terracotta" : "bg-border-cream"}`}>
                      {isDone     ? <Check className="w-3.5 h-3.5 text-white" />
                       : isCurrent ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                       : <div className="w-2 h-2 rounded-full bg-stone/30" />}
                    </div>
                    <span className={`text-[14px] transition-all duration-300 ${isDone ? "text-stone line-through" : isCurrent ? "text-near-black font-semibold" : "text-stone/50"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 h-1.5 bg-border-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, ((currentStepIdx + 1) / STEPS.length) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Main Login Card ── */}
        {!isUnlocking && mode !== "reset" && (
          <div className={`${card} p-8`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[21px] font-semibold text-near-black">
                  {mode === "recovery" ? "Use recovery key" : "Unlock vault"}
                </h2>
                <p className="text-[13px] text-stone mt-1">
                  {mode === "recovery"
                    ? "Enter your recovery key to restore access."
                    : "Enter your master password to access your items."}
                </p>
              </div>
              {mode === "recovery" && (
                <button
                  onClick={() => { setMode("password"); setError(""); }}
                  className="text-[12px] text-terracotta hover:text-coral font-medium transition-colors flex-shrink-0 ml-3"
                >
                  ← Password
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-stone">
                  {mode === "recovery" ? "Recovery Key" : "Master Password"}
                </label>
                <div className="relative">
                  {mode === "password" ? (
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      autoFocus
                      placeholder="Enter master password"
                      className={inp(!!error)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={recoveryKey}
                      onChange={(e) => { setRecoveryKey(e.target.value.toUpperCase()); setError(""); }}
                      autoFocus
                      placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                      className={`${inp(!!error)} font-mono tracking-widest`}
                    />
                  )}
                  {mode === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone hover:text-charcoal transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-600 leading-relaxed">{error}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!(mode === "recovery" ? recoveryKey : password) || loading}
                className="w-full py-3 rounded-xl bg-terracotta text-white font-bold text-[15px] flex items-center justify-center gap-2.5 hover:bg-coral transition-all shadow-[0_8px_20px_rgba(201,100,66,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Lock className="w-5 h-5" />
                {mode === "recovery" ? "Restore vault" : "Unlock vault"}
              </button>
            </form>

            {/* ── Secondary links ── */}
            <div className="mt-5 pt-5 border-t border-border-cream space-y-2">
              {mode === "password" && (
                <button
                  onClick={() => { setMode("recovery"); setError(""); }}
                  className="w-full text-[13px] text-stone hover:text-charcoal transition-colors flex items-center justify-center gap-1.5 py-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Use recovery key instead
                </button>
              )}
              {attempts >= 3 && (
                <button
                  onClick={() => setMode("reset")}
                  className="w-full text-[13px] text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 py-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset vault (delete all data)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Reset Confirmation ── */}
        {!isUnlocking && mode === "reset" && (
          <div className={`${card} p-8 space-y-5`}>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div className="text-center">
              <h2 className="font-serif text-[19px] font-semibold text-near-black">Reset vault?</h2>
              <p className="text-[13px] text-stone mt-2 leading-relaxed">
                This will permanently delete <strong className="text-charcoal">all saved items</strong>. This cannot be undone.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600 text-center">
              All passwords, notes, cards, and 2FA codes will be lost forever.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMode("password")}
                className="flex-1 py-2.5 rounded-xl border border-border-cream bg-ivory text-charcoal text-[14px] font-medium hover:bg-border-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[14px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete everything"}
              </button>
            </div>
          </div>
        )}

        {/* ── "Don't have a vault?" CTA ── */}
        {!isUnlocking && mode !== "reset" && (
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-[13px] text-stone hover:text-terracotta transition-colors font-medium"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Don't have a vault? Create one
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
