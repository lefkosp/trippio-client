import { useState, useMemo } from "react";
import { useResetOnChange } from "@/shared/hooks/useResetOnChange";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import { useDays } from "@/shared/hooks/queries";
import { useGenerateDays, useUpdateDay } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { useAuth } from "@/auth/useAuth";
import { cn, formatDate } from "@/lib/utils";
import { buildCityColorMap, type CityColorMap } from "@/lib/cityColor";
import { toast } from "sonner";
import type { Day } from "@/shared/types";

/** The moment you change city — the day you spend on a plane or a train. Given
 *  its own row because it's the structural joint of the whole trip, and the old
 *  list rendered it as just another indistinguishable row. */
function LegBreak({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-elev-2/60 border-y border-border">
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
      <span className="text-section-label truncate">
        {from} → {to}
      </span>
    </div>
  );
}

function DayRow({
  day,
  cityColors,
  onEditCity,
  isToday,
}: {
  day: Day;
  cityColors: CityColorMap;
  onEditCity: (day: Day) => void;
  isToday: boolean;
}) {
  const navigate = useNavigate();
  const dateStr = formatDate(day.date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const cityConfig = day.city ? cityColors.get(day.city) : undefined;

  return (
    <div
      className={cn(
        "w-full flex items-center gap-3 pr-3 hover-lift transition-colors border-l-[3px]",
        cityConfig ? `${cityConfig.fgClass} border-current` : "border-transparent",
        isToday && "bg-primary/[0.06]",
      )}
    >
      <button
        onClick={() => navigate(`/itinerary/${day._id}`)}
        className="flex items-center gap-3.5 flex-1 min-w-0 text-left py-3 pl-3.5"
      >
        <span className="text-numeral text-[1.75rem] text-foreground shrink-0 w-9">
          {String(day.dayNumber).padStart(2, "0")}
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-data text-[11px] text-muted-foreground">
            {dateStr}
          </span>
          {day.notes ? (
            <span className="block text-sm text-foreground/90 truncate mt-0.5">
              {day.notes}
            </span>
          ) : (
            <span className="block text-sm text-muted-foreground/60 italic mt-0.5">
              Nothing noted
            </span>
          )}
        </span>
      </button>

      {isToday && (
        <span className="text-data text-[10px] text-primary shrink-0 tracking-[0.08em]">
          TODAY
        </span>
      )}

      {/* City — separate tap target from the row navigation */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEditCity(day);
        }}
        className="shrink-0 press-scale"
        aria-label={day.city ? `Change city for day ${day.dayNumber}` : "Set city"}
      >
        {day.city ? (
          <span className={`badge-subtle ${cityConfig?.bgClass ?? ""} ${cityConfig?.fgClass ?? ""}`}>
            {day.city}
          </span>
        ) : (
          <span className="badge-subtle gap-1 bg-elev-2 text-muted-foreground border border-dashed border-border">
            <Pencil className="h-2.5 w-2.5" />
            City
          </span>
        )}
      </button>
    </div>
  );
}

function EditCitySheet({
  day,
  open,
  onOpenChange,
  tripId,
}: {
  day: Day | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
}) {
  const updateDay = useUpdateDay(tripId);
  const [city, setCity] = useState(day?.city ?? "");

  useResetOnChange(open ? (day?._id ?? "none") : null, () => {
    setCity(day?.city ?? "");
  });

  function handleSave() {
    if (!day) return;
    updateDay.mutate(
      { dayId: day._id, data: { city: city.trim() } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) => toast.error(e.message),
      }
    );
  }

  if (!day) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg tracking-tight">
            Day {day.dayNumber} city
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pt-1 px-4 pb-6">
          <Input
            placeholder="e.g. Beijing"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={updateDay.isPending}
            >
              {updateDay.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ItineraryScreen() {
  const { tripId, trip } = useTripContext();
  const { isReadOnly } = useAuth();
  const { data: days, isLoading } = useDays(tripId);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const generateDays = useGenerateDays(tripId);

  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Built once from the day list (in date order) so every city on this trip
  // gets a distinct colour up to the palette size, and the same city always
  // renders the same colour across the filter chips and the day rows below.
  const cityColors = useMemo(
    () => buildCityColorMap(days?.map((d) => d.city) ?? []),
    [days]
  );

  const cityFilterOptions: FilterOption[] = useMemo(() => {
    return Array.from(cityColors.entries()).map(([city, config]) => ({
      value: city,
      label: city,
      bgClass: config.bgClass,
      fgClass: config.fgClass,
    }));
  }, [cityColors]);

  const filteredDays = useMemo(() => {
    if (!days) return undefined;
    if (!activeCity) return days;
    return days.filter((d) => d.city === activeCity);
  }, [days, activeCity]);

  const tripLengthDays = useMemo(() => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [trip.startDate, trip.endDate]);

  function handleEditCity(day: Day) {
    setEditingDay(day);
    setEditOpen(true);
  }

  function handleGenerate() {
    generateDays.mutate(undefined, {
      onSuccess: () => toast.success(`${tripLengthDays} days added`),
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-6 pb-3 glass border-b border-border/50 space-y-4">
        <h1 className="text-page-title">Days</h1>

        {/* City filter */}
        {cityFilterOptions.length > 0 && (
          <FilterChips
            options={cityFilterOptions}
            selected={activeCity}
            onChange={setActiveCity}
          />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : days && days.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">No days laid out yet</p>
          {!isReadOnly && (
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleGenerate}
              disabled={generateDays.isPending}
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
              {generateDays.isPending
                ? "Generating…"
                : `Lay out all ${tripLengthDays} days`}
            </Button>
          )}
        </div>
      ) : filteredDays && filteredDays.length > 0 ? (
        <div
          key={activeCity ?? "all"}
          className="-mx-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          {filteredDays.map((day, i) => {
            const prev = filteredDays[i - 1];
            const changedCity =
              prev && prev.city && day.city && prev.city !== day.city;
            return (
              <div key={day._id}>
                {changedCity && <LegBreak from={prev.city} to={day.city} />}
                {!changedCity && i > 0 && (
                  <div className="ml-[3px] border-b border-border/70" />
                )}
                <DayRow
                  day={day}
                  cityColors={cityColors}
                  onEditCity={handleEditCity}
                  isToday={day.date.slice(0, 10) === todayIso}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No days in that city
          </p>
        </div>
      )}

      <EditCitySheet
        day={editingDay}
        open={editOpen}
        onOpenChange={setEditOpen}
        tripId={tripId}
      />
    </div>
  );
}
