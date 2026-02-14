import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // "HH:mm" or ""
  onChange: (time: string) => void;
  placeholder?: string;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 00, 05, … 55

/** Scrollable column for picking a number. */
function ScrollColumn({
  values,
  selected,
  onSelect,
  formatFn = pad,
}: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  formatFn?: (n: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44;
  const hasScrolled = useRef(false);

  // Scroll to selected on mount
  useEffect(() => {
    if (containerRef.current && !hasScrolled.current) {
      const idx = values.indexOf(selected);
      if (idx >= 0) {
        containerRef.current.scrollTop = idx * itemHeight - itemHeight * 2;
      }
      hasScrolled.current = true;
    }
  }, [selected, values]);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-[220px] overflow-y-auto scrollbar-hide snap-y snap-mandatory rounded-xl bg-elev-2/50 border border-border"
    >
      {/* Top spacer */}
      <div style={{ height: itemHeight * 2 }} />
      {values.map((v) => {
        const isActive = v === selected;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={cn(
              "w-full flex items-center justify-center snap-center transition-all",
              isActive
                ? "text-primary font-bold text-xl"
                : "text-muted-foreground text-base"
            )}
            style={{ height: itemHeight }}
          >
            {formatFn(v)}
          </button>
        );
      })}
      {/* Bottom spacer */}
      <div style={{ height: itemHeight * 2 }} />
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse current value
  const parsed = value ? value.split(":").map(Number) : null;
  const [hour, setHour] = useState(parsed?.[0] ?? 9);
  const [minute, setMinute] = useState(() => {
    if (!parsed) return 0;
    // Snap to nearest 5
    return Math.round(parsed[1] / 5) * 5;
  });

  // Sync internal state when value changes externally
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setHour(h);
      setMinute(Math.round(m / 5) * 5);
    }
  }, [value]);

  const handleConfirm = useCallback(() => {
    onChange(`${pad(hour)}:${pad(minute)}`);
    setOpen(false);
  }, [hour, minute, onChange]);

  const displayValue = value || null;

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-9 w-full rounded-md border px-3 text-sm transition-all press-scale",
          "bg-transparent border-input shadow-xs",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">{displayValue ?? placeholder}</span>
      </button>

      {/* Picker sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl bg-elev-1 border-t border-border"
        >
          <SheetHeader className="text-left pb-1">
            <SheetTitle className="text-lg tracking-tight">
              Pick a time
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-6 pt-2">
            {/* Current selection */}
            <div className="text-center mb-4">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {pad(hour)}
              </span>
              <span className="text-3xl font-bold tracking-tight text-muted-foreground mx-1">
                :
              </span>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {pad(minute)}
              </span>
            </div>

            {/* Scroll columns */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 space-y-1.5">
                <p className="text-section-label text-center">Hour</p>
                <ScrollColumn
                  values={HOURS}
                  selected={hour}
                  onSelect={setHour}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-section-label text-center">Minute</p>
                <ScrollColumn
                  values={MINUTES}
                  selected={minute}
                  onSelect={setMinute}
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {["07:00", "08:00", "09:00", "10:00", "12:00", "14:00", "18:00", "20:00"].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const [h, m] = preset.split(":").map(Number);
                      setHour(h);
                      setMinute(m);
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all press-scale border",
                      value === preset
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-elev-2 text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleConfirm}
              >
                Set {pad(hour)}:{pad(minute)}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
