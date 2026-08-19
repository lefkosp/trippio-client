import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CalendarPlus, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils";
import { buildCityColorMap, type CityColorMap } from "@/lib/cityColor";
import { toast } from "sonner";
import type { Day } from "@/shared/types";

function DayRow({
  day,
  cityColors,
  onEditCity,
}: {
  day: Day;
  cityColors: CityColorMap;
  onEditCity: (day: Day) => void;
}) {
  const navigate = useNavigate();
  const dateStr = formatDate(day.date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const cityConfig = day.city ? cityColors.get(day.city) : undefined;

  return (
    <div className="w-full flex items-center gap-3 py-3 px-2 hover-lift rounded-lg transition-colors">
      <button
        onClick={() => navigate(`/itinerary/${day._id}`)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        {/* Day number circle */}
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-elev-2 border border-border text-xs font-bold text-muted-foreground shrink-0">
          {day.dayNumber}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm">Day {day.dayNumber}</p>
          </div>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
          {day.notes && (
            <p className="text-xs text-muted-foreground/70 italic mt-0.5 truncate">
              {day.notes}
            </p>
          )}
        </div>
      </button>

      {/* City — separate tap target from the row navigation */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEditCity(day);
        }}
        className="shrink-0 press-scale"
      >
        {day.city ? (
          <span className={`badge-subtle flex items-center gap-1 ${cityConfig?.bgClass ?? ""} ${cityConfig?.fgClass ?? ""}`}>
            {day.city}
          </span>
        ) : (
          <span className="badge-subtle flex items-center gap-1 bg-elev-2 text-muted-foreground border border-dashed border-border">
            <Pencil className="h-2.5 w-2.5" />
            City
          </span>
        )}
      </button>

      <ChevronRight
        className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-pointer"
        onClick={() => navigate(`/itinerary/${day._id}`)}
      />
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

  useEffect(() => {
    if (open) setCity(day?.city ?? "");
  }, [open, day]);

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
      <h1 className="text-page-title">Itinerary</h1>

      {/* City filter */}
      {cityFilterOptions.length > 0 && (
        <FilterChips
          options={cityFilterOptions}
          selected={activeCity}
          onChange={setActiveCity}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : days && days.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">No days yet</p>
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
                : `Generate ${tripLengthDays} days from your trip dates`}
            </Button>
          )}
        </div>
      ) : filteredDays && filteredDays.length > 0 ? (
        <Card>
          <CardContent className="p-2">
            {filteredDays.map((day, i) => (
              <div key={day._id}>
                <DayRow day={day} cityColors={cityColors} onEditCity={handleEditCity} />
                {i < (filteredDays.length - 1) && (
                  <div className="mx-2 border-b border-border" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No days match this filter
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
