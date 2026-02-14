import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  bgClass?: string;
  fgClass?: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string | null; // null = "All"
  onChange: (value: string | null) => void;
  /** Label shown on the "all" chip. Defaults to "All" */
  allLabel?: string;
}

export function FilterChips({
  options,
  selected,
  onChange,
  allLabel = "All",
}: FilterChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {/* "All" chip */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all press-scale border",
          selected === null
            ? "bg-primary/15 text-primary border-primary/30"
            : "bg-elev-2 text-muted-foreground border-transparent"
        )}
      >
        {allLabel}
      </button>

      {options.map((opt) => {
        const active = selected === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? null : opt.value)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all press-scale border",
              active
                ? opt.bgClass && opt.fgClass
                  ? `${opt.bgClass} ${opt.fgClass} border-current`
                  : "bg-primary/15 text-primary border-primary/30"
                : "bg-elev-2 text-muted-foreground border-transparent"
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
