import { LayoutGrid, List, AlignJustify } from "lucide-react";
import type { ViewMode } from "@/lib/prefs";

interface Props {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}

const MODES: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
  { id: "grid",    icon: <LayoutGrid className="w-3.5 h-3.5" />,    label: "Grid" },
  { id: "list",    icon: <List className="w-3.5 h-3.5" />,          label: "List" },
  { id: "compact", icon: <AlignJustify className="w-3.5 h-3.5" />,  label: "Compact" },
];

export function ViewToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center bg-parchment dark:bg-[#0f0f0f] border border-border-cream dark:border-white/10 rounded-lg p-0.5 gap-0.5">
      {MODES.map((m) => (
        <button
          key={m.id}
          title={m.label}
          onClick={() => onChange(m.id)}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 ${
            mode === m.id
              ? "bg-white dark:bg-white/10 text-terracotta shadow-sm"
              : "text-stone dark:text-silver/60 hover:text-charcoal dark:hover:text-white"
          }`}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
