import { useState } from "react";
import { Download, Upload, AlertTriangle, Trash2, Database } from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { BackupModal } from "./BackupModal";

interface DataBackupSettingsProps {
  onOpenBackup?: () => void;
}

export function DataBackupSettings({ onOpenBackup }: DataBackupSettingsProps) {
  const { reset } = useAuth();
  const navigate = useNavigate();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await reset();
    navigate({ to: "/register" });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="font-serif text-[32px] font-bold text-near-black dark:text-white leading-tight tracking-tight">Data & Backup</h1>
      <p className="text-[14px] text-stone dark:text-silver/60 mt-2 mb-10 font-medium leading-relaxed max-w-xl">
        Manage your recovery keys, backups, and vault data.
      </p>
      
      {/* Export / Import */}
      <div className="bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-2xl p-8 mb-8 shadow-sm">
        <h3 className="text-[15px] font-bold text-near-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-terracotta/10 rounded-xl flex items-center justify-center">
            <Database className="w-4.5 h-4.5 text-terracotta" />
          </div>
          Vault Backup
        </h3>

        <div className="space-y-6">
          <p className="text-[14px] text-stone dark:text-silver/60 leading-relaxed font-medium max-w-lg">
            Exporting creates an encrypted <code className="text-[11px] bg-border-cream dark:bg-white/5 px-1 py-0.5 rounded font-bold">.vaultly</code> file. 
            Importing will replace your current vault entirely.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={onOpenBackup}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 text-charcoal dark:text-white text-[13.5px] font-bold hover:border-terracotta/40 hover:text-terracotta transition-all shadow-sm active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Export Vault
            </button>

            <button
              onClick={onOpenBackup}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 text-charcoal dark:text-white text-[13.5px] font-bold hover:border-terracotta/40 hover:text-terracotta transition-all shadow-sm active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              Import Backup
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 rounded-2xl p-8">
        <h3 className="text-[15px] font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-3 uppercase tracking-[0.12em]">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          Danger Zone
        </h3>
        
        <p className="text-[14px] text-red-800/70 dark:text-red-300/70 leading-relaxed mb-8 font-medium max-w-lg">
          Deleting your vault will permanently erase all passwords, secure notes, and 
          credit cards from this device. This action <strong>cannot be undone</strong>.
        </p>

        {confirmDelete ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-12 rounded-xl border border-border-cream dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-charcoal dark:text-white text-[13.5px] font-bold hover:bg-border-light dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl bg-red-500 text-white text-[13.5px] font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_6px_20px_rgba(239,68,68,0.3)]"
            >
              {isDeleting ? "Deleting..." : "Yes, delete everything"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-6 py-3 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[13.5px] font-bold hover:bg-red-200 dark:hover:bg-red-500/20 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4.5 h-4.5" />
            Delete Vault Data
          </button>
        )}
      </div>
    </div>
  );
}
  );
}
