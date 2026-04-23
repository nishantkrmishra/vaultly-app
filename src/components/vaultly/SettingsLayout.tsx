import { useState } from "react";
import { SettingsSidebar } from "./SettingsSidebar";
import { AccountSettings } from "./AccountSettings";
import { SecuritySettings } from "./SecuritySettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { VaultSettings } from "./VaultSettings";
import { DataBackupSettings } from "./DataBackupSettings";

export type SettingsTab = "account" | "security" | "appearance" | "vault" | "data";

interface SettingsLayoutProps {
  onOpenChangePw?: () => void;
  onOpenBackup?: () => void;
  onOpenRegenKey?: () => void;
}

export function SettingsLayout({ onOpenChangePw, onOpenBackup, onOpenRegenKey }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 max-w-[1100px] w-full mx-auto px-8 py-10 animate-in fade-in duration-500">
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 min-w-0 w-full space-y-8">
        {activeTab === "account" && <AccountSettings />}
        {activeTab === "security" && (
          <SecuritySettings 
            onOpenChangePw={onOpenChangePw} 
            onOpenRegenKey={onOpenRegenKey} 
          />
        )}
        {activeTab === "appearance" && <AppearanceSettings />}
        {activeTab === "vault" && <VaultSettings />}
        {activeTab === "data" && (
          <DataBackupSettings 
            onOpenBackup={onOpenBackup} 
          />
        )}
      </div>
    </div>
  );
}
