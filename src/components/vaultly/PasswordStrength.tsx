import React from "react";

interface PasswordStrengthProps {
  strength: "weak" | "medium" | "strong" | null;
  showLabel?: boolean;
  showBar?: boolean;
}

export function PasswordStrength({ strength, showLabel = true, showBar = false }: PasswordStrengthProps) {
  if (!strength) return null;

  const config = {
    weak: {
      color: "#ef4444",
      label: "Weak",
      width: "30%",
    },
    medium: {
      color: "#f59e0b",
      label: "Medium",
      width: "60%",
    },
    strong: {
      color: "#22c55e",
      label: "Strong",
      width: "100%",
    },
  };

  const { color, label, width } = config[strength];

  return (
    <div className="space-y-3 w-full">
      {showLabel && (
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-colors duration-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-[12px] text-stone dark:text-silver/80 font-medium tracking-tight">
            {label}
          </span>
        </div>
      )}
      
      {showBar && (
        <div className="h-1 w-full bg-[#e8e6dc] dark:bg-[#27272a] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              backgroundColor: color,
              width: width,
              boxShadow: `0 0 10px ${color}20`
            }}
          />
        </div>
      )}
    </div>
  );
}


