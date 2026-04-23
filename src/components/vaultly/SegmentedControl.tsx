interface Option<T> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T> {
  options: (string | Option<T>)[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex items-center h-10 bg-ivory/60 dark:bg-white/5 border border-border-cream dark:border-white/10 rounded-full p-1 gap-1 ${className}`}>
      {options.map((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        const val = typeof opt === "string" ? (opt as unknown as T) : opt.value;
        const isActive = value === val;

        return (
          <button
            key={String(val)}
            onClick={() => onChange(val)}
            className={`px-4 py-1.5 h-full rounded-full text-[12px] font-bold transition-all capitalize whitespace-nowrap flex items-center justify-center ${
              isActive
                ? "bg-terracotta text-white shadow-sm"
                : "text-stone dark:text-silver/60 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
