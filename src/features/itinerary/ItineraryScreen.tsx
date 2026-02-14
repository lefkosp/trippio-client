import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import { useDays } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import { formatDate } from "@/lib/utils";
import type { Day } from "@/shared/types";

const cityBadgeConfig: Record<string, { bgClass: string; fgClass: string }> = {
  Tokyo: { bgClass: "bg-city-tokyo", fgClass: "text-city-tokyo-foreground" },
  Kyoto: { bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
  Osaka: { bgClass: "bg-city-osaka", fgClass: "text-city-osaka-foreground" },
};

const cityFilterOptions: FilterOption[] = [
  { value: "Tokyo", label: "Tokyo", bgClass: "bg-city-tokyo", fgClass: "text-city-tokyo-foreground" },
  { value: "Kyoto", label: "Kyoto", bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
  { value: "Osaka", label: "Osaka", bgClass: "bg-city-osaka", fgClass: "text-city-osaka-foreground" },
];

function DayRow({ day }: { day: Day }) {
  const navigate = useNavigate();
  const dateStr = formatDate(day.date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const cityConfig = cityBadgeConfig[day.city];

  return (
    <button
      onClick={() => navigate(`/itinerary/${day._id}`)}
      className="w-full flex items-center gap-3 py-3 px-2 text-left hover-lift rounded-lg transition-colors"
    >
      {/* Day number circle */}
      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-elev-2 border border-border text-xs font-bold text-muted-foreground shrink-0">
        {day.dayNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-sm">Day {day.dayNumber}</p>
          {cityConfig && (
            <span className={`badge-subtle ${cityConfig.bgClass} ${cityConfig.fgClass}`}>
              {day.city}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
        {day.notes && (
          <p className="text-xs text-muted-foreground/70 italic mt-0.5 truncate">
            {day.notes}
          </p>
        )}
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
    </button>
  );
}

export function ItineraryScreen() {
  const { tripId } = useTripContext();
  const { data: days, isLoading } = useDays(tripId);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const filteredDays = useMemo(() => {
    if (!days) return undefined;
    if (!activeCity) return days;
    return days.filter((d) => d.city === activeCity);
  }, [days, activeCity]);

  return (
    <div className="space-y-6">
      <h1 className="text-page-title">Itinerary</h1>

      {/* City filter */}
      <FilterChips
        options={cityFilterOptions}
        selected={activeCity}
        onChange={setActiveCity}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredDays && filteredDays.length > 0 ? (
        <Card>
          <CardContent className="p-2">
            {filteredDays.map((day, i) => (
              <div key={day._id}>
                <DayRow day={day} />
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
            No days in {activeCity}
          </p>
        </div>
      )}
    </div>
  );
}
