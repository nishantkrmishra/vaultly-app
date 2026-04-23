/**
 * BackupModal.tsx — Export / Import .vaultly backup files
 */

import { useState, useRef } from "react";
import { X, Download, Upload, AlertTriangle, Check, Loader2, ShieldCheck, FileText, XCircle } from "lucide-react";
import { exportVault, parseBackupFile, importVault, type VaultlyBackup } from "@/lib/backup";
import { toast } from "sonner";
import { useAuth } from "@/store/auth-context";

interface Props {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStage = "idle" | "preview" | "confirm" | "done";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export function BackupModal({ open, onClose, onImportComplete }: Props) {
  const { reset } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importStage, setImportStage] = useState<ImportStage>("idle");
  const [importError, setImportError] = useState("");
  const [preview, setPreview] = useState<VaultlyBackup | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportVault();
      toast.success("Vault exported successfully");
    } catch (e: unknown) {
      toast.error("Export failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  const processFile = async (file: File) => {
    setImportError("");
    if (!file.name.endsWith(".vaultly") && !file.name.endsWith(".json")) {
      setImportError("Invalid file type. Please select a .vaultly file."); return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setImportError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`); return;
    }
    setSelectedFile({ name: file.name, size: file.size });
    try {
      const backup = await parseBackupFile(file);
      setPreview(backup);
      setImportStage("preview");
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Invalid file");
      setSelectedFile(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const clearFile = () => { setSelectedFile(null); setImportError(""); setPreview(null); setImportStage("idle"); };

  const handleImportConfirm = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      await importVault(preview);
      setImportStage("done");
      toast.success("Vault imported! Please log in with the backup's password.");
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 2500);
    } catch (err: unknown) {
      toast.error("Import failed: " + (err instanceof Error ? err.message : "Unknown error"));
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (importing) return;
    setImportStage("idle"); setImportError(""); setPreview(null); setSelectedFile(null);
    onClose();
  };

  const formatDate = (ms: number) => new Date(ms).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[12px]" onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-ivory dark:bg-[#1a1a1a] w-full max-w-[480px] rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-border-cream dark:border-white/5 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-cream dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-near-black dark:text-white">Backup &amp; Restore</h2>
            <p className="text-[13px] text-stone dark:text-silver/80 mt-0.5">Export your encrypted vault or restore from a backup.</p>
          </div>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone hover:bg-border-light dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {importStage === "done" ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-4">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-serif text-[20px] font-semibold text-near-black dark:text-white mb-2">Import successful!</h3>
              <p className="text-[13px] text-stone dark:text-silver/80">Log in with the backup's master password to access your items.</p>
              <Loader2 className="w-5 h-5 animate-spin text-terracotta mx-auto mt-4" />
            </div>
          ) : importStage === "preview" && preview ? (
            <div className="space-y-4">
              <div className="bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-terracotta" />
                  <span className="text-[13px] font-semibold text-near-black dark:text-white">Backup preview</span>
                </div>
                <div className="space-y-1.5 text-[12px] text-stone dark:text-silver/80">
                  <div className="flex justify-between"><span>Items:</span><span className="font-semibold text-near-black dark:text-white">{preview.items.length}</span></div>
                  <div className="flex justify-between"><span>Created:</span><span className="font-semibold text-near-black dark:text-white">{formatDate(preview.created_at)}</span></div>
                  <div className="flex justify-between"><span>Format version:</span><span className="font-semibold text-near-black dark:text-white">{preview.version}</span></div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 dark:text-amber-300">This will <strong>replace all current vault data</strong>. After import you must log in with the backup's master password.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setImportStage("idle"); setPreview(null); }} className="flex-1 py-2.5 rounded-xl border border-border-cream dark:border-white/10 text-[14px] font-medium text-charcoal dark:text-white hover:bg-border-light dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleImportConfirm} disabled={importing}
                  className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-[14px] font-bold hover:bg-coral transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_12px_rgba(201,100,66,0.25)]">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {importing ? "Importing…" : "Restore backup"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Export */}
              <div className="bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-near-black dark:text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-terracotta" />Export vault
                    </div>
                    <p className="text-[12px] text-stone dark:text-silver/80 mt-1 leading-relaxed">
                      Download an encrypted <code className="text-[11px] bg-border-cream dark:bg-white/5 px-1 py-0.5 rounded">.vaultly</code> backup. Items remain encrypted in the file.
                    </p>
                  </div>
                  <button onClick={handleExport} disabled={exporting}
                    className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg bg-terracotta text-white text-[13px] font-bold hover:bg-coral transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(201,100,66,0.25)]">
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {exporting ? "Exporting…" : "Export"}
                  </button>
                </div>
              </div>

              {/* Import */}
              <div className="bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl p-4">
                <div className="text-[15px] font-semibold text-near-black dark:text-white flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4 text-terracotta" />Restore from backup
                </div>
                <p className="text-[12px] text-stone dark:text-silver/80 mb-3 leading-relaxed">
                  Import a <code className="text-[11px] bg-border-cream dark:bg-white/5 px-1 py-0.5 rounded">.vaultly</code> file. You'll need the backup's master password.
                </p>

                {selectedFile ? (
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-emerald-800 dark:text-emerald-300 truncate">{selectedFile.name}</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button onClick={clearFile} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-white/10 transition-colors text-emerald-600 dark:text-emerald-400">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="backup-file-input"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-all ${
                      dragOver
                        ? "border-terracotta bg-terracotta/5"
                        : "border-border-cream dark:border-white/10 hover:border-terracotta/40 hover:bg-terracotta/3"
                    }`}>
                    <Upload className="w-6 h-6 text-stone dark:text-silver/60" />
                    <div className="text-[13px] text-stone dark:text-silver/70 text-center">
                      <span className="font-medium text-terracotta">Click to choose</span> or drag & drop<br />
                      <span className="text-[11px]">.vaultly files only · Max 5 MB</span>
                    </div>
                  </label>
                )}
                <input id="backup-file-input" ref={fileRef} type="file" accept=".vaultly,.json" onChange={handleFileSelect} className="hidden" />

                {importError && (
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{importError}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 text-[12px] text-stone dark:text-silver/80">
                <ShieldCheck className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                <span>Backup files contain only encrypted data. Without the master password, the contents cannot be read.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
