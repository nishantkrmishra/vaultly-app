import { useState, useRef } from "react";
import { X, Camera, Save, User, Mail, FileText } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "./ToastProvider";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { settings, updateSetting } = useSettings();
  const { success } = useToast();
  const [formData, setFormData] = useState({
    displayName: settings.displayName,
    email: settings.email,
    bio: "", // local state for demo
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleSave = () => {
    updateSetting("displayName", formData.displayName);
    updateSetting("email", formData.email);
    success("Profile updated", "Your profile details have been saved locally.");
    onClose();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSetting("avatar", reader.result as string);
        success("Avatar updated", "Your new profile picture has been saved.");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-near-black/20 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="w-[420px] bg-ivory dark:bg-[#1a1a1a] border border-border-cream dark:border-white/5 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border-cream dark:border-white/5">
          <h2 className="font-serif text-[24px] font-bold text-near-black dark:text-white">Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone/5 dark:hover:bg-white/5 text-stone transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Selection */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-24 h-24 rounded-full bg-terracotta/10 border-2 border-terracotta/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-terracotta group-hover:scale-105">
                {settings.avatar ? (
                  <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-terracotta" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <button 
              onClick={handleAvatarClick}
              className="mt-3 text-[12px] font-bold text-terracotta uppercase tracking-wider hover:underline"
            >
              Update Image
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-terracotta/50 transition-all text-near-black dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-terracotta/50 transition-all text-near-black dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-stone dark:text-silver/80 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Personal Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Optional notes about yourself..."
                rows={3}
                className="w-full bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-terracotta/50 transition-all text-near-black dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-terracotta text-white text-[13.5px] font-semibold hover:bg-coral transition-all shadow-[0_4px_14px_rgba(201,100,66,0.25)] flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
