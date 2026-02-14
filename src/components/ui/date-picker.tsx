import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (date: string) => void;
  placeholder?: string;
  /** Optional YYYY-MM-DD bounds */
  min?: string;
  max?: string;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0 = Mon … 6 = Sun (ISO week) */
function getWeekdayISO(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // View month state — initialize to value's month or current month
  const initial = value ? parseISO(value) : null;
  const [viewYear, setViewYear] = useState(
    initial?.year ?? new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    initial?.month ?? new Date().getMonth()
  );

  const displayValue = useMemo(() => {
    if (!value) return null;
    return new Date(value + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [value]);

  // Calendar grid
  const cells = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOffset = getWeekdayISO(viewYear, viewMonth, 1); // 0=Mon

    const result: (number | null)[] = [];
    // Leading blanks
    for (let i = 0; i < firstDayOffset; i++) result.push(null);
    // Days
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    // Trailing blanks to fill last row
    while (result.length % 7 !== 0) result.push(null);

    return result;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isDisabled(day: number) {
    const iso = toISO(viewYear, viewMonth, day);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function handleSelect(day: number) {
    if (isDisabled(day)) return;
    const iso = toISO(viewYear, viewMonth, day);
    onChange(iso);
    setOpen(false);
  }

  const selectedISO = value || "";
  const todayISO = new Date().toISOString().split("T")[0];
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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
        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {displayValue ?? placeholder}
        </span>
      </button>

      {/* Calendar sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl bg-elev-1 border-t border-border"
        >
          <SheetHeader className="text-left pb-1">
            <SheetTitle className="text-lg tracking-tight">
              Pick a date
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-6 pt-2">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{monthLabel}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`blank-${i}`} className="h-10" />;
                }
                const iso = toISO(viewYear, viewMonth, day);
                const isSelected = iso === selectedISO;
                const isToday = iso === todayISO;
                const disabled = isDisabled(day);

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(day)}
                    className={cn(
                      "h-10 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all press-scale",
                      disabled && "opacity-30 cursor-not-allowed",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-elev-2"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Clear / Today shortcuts */}
            <div className="flex gap-2 mt-4">
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
                variant="outline"
                size="sm"
                className="text-xs ml-auto"
                onClick={() => {
                  const today = new Date();
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                }}
              >
                Today
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
