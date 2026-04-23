import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, description?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    toast: addToast,
    success: (t: string, d?: string) => addToast(t, d, "success"),
    error: (t: string, d?: string) => addToast(t, d, "error"),
    info: (t: string, d?: string) => addToast(t, d, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  return (
    <div className="w-[320px] bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-xl px-4 py-3 shadow-sm pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-300 relative group overflow-hidden">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {toast.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
          {toast.type === "error" && <XCircle className="w-4 h-4 text-red-500" />}
          {toast.type === "info" && <Info className="w-4 h-4 text-stone dark:text-silver/50" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-near-black dark:text-white leading-tight">
            {toast.title}
          </div>
          {toast.description && (
            <div className="text-[12px] text-stone/80 dark:text-silver/60 mt-1 leading-snug">
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-stone/5 dark:hover:bg-white/5 text-stone transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-terracotta/20 w-full">
        <div className="h-full bg-terracotta animate-progress" />
      </div>
    </div>
  );
}
