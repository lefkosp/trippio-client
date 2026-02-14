import { useState, useMemo } from "react";
import { Navigation, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDays, useEventsWithPlaces } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import type { Day, Place } from "@/shared/types";

function DaySelector({
  days,
  selectedDayId,
  onSelect,
}: {
  days: Day[];
  selectedDayId: string;
  onSelect: (dayId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {days.map((day) => {
        const active = selectedDayId === day._id;
        return (
          <button
            key={day._id}
            onClick={() => onSelect(day._id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 press-scale border ${
              active
                ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_rgba(45,212,191,0.15)]"
                : "bg-elev-1 text-muted-foreground border-border hover:border-border"
            }`}
          >
            D{day.dayNumber} · {day.city}
          </button>
        );
      })}
    </div>
  );
}

function MapEmbed({ places }: { places: Place[] }) {
  // Build an OpenStreetMap embed centered on the first place, or a sensible default
  const center = useMemo(() => {
    if (places.length > 0 && places[0].lat && places[0].lng) {
      return { lat: places[0].lat, lng: places[0].lng };
    }
    // Default: Tokyo
    return { lat: 35.6762, lng: 139.6503 };
  }, [places]);

  // Build marker list for the embed URL
  const markers = places
    .filter((p) => p.lat && p.lng)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");

  // Use OpenStreetMap embed with markers
  const embedUrl = markers
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.03},${center.lng + 0.05},${center.lat + 0.03}&layer=mapnik&marker=${center.lat},${center.lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.03},${center.lng + 0.05},${center.lat + 0.03}&layer=mapnik`;

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <iframe
        src={embedUrl}
        className="w-full h-56 bg-elev-2"
        style={{ border: 0 }}
        title="Map"
        loading="lazy"
      />
      {places.length > 0 && (
        <div className="px-3 py-2 bg-elev-1 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {places.length} place{places.length !== 1 ? "s" : ""} on this day
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary"
            asChild
          >
            <a
              href={`https://www.google.com/maps/dir/${places
                .filter((p) => p.lat && p.lng)
                .map((p) => `${p.lat},${p.lng}`)
                .join("/")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open route in Google Maps
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export function MapScreen() {
  const { tripId } = useTripContext();
  const { data: days, isLoading: daysLoading } = useDays(tripId);

  const [selectedDayId, setSelectedDayId] = useState("");
  const effectiveDayId =
    selectedDayId ||
    (days && days.length > 0 ? (days[1]?._id ?? days[0]._id) : "");

  const { data: events, isLoading: eventsLoading } = useEventsWithPlaces(
    effectiveDayId,
    tripId
  );

  const placesWithCoords = useMemo(
    () =>
      events
        ?.filter((e) => e.place?.lat && e.place?.lng)
        .map((e) => e.place!)
        .filter(
          (place, index, arr) =>
            arr.findIndex((p) => p._id === place._id) === index
        ) ?? [],
    [events]
  );

  if (daysLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-page-title">Map</h1>

      {/* Day selector */}
      {days && (
        <DaySelector
          days={days}
          selectedDayId={effectiveDayId}
          onSelect={setSelectedDayId}
        />
      )}

      {/* Map embed */}
      <MapEmbed places={placesWithCoords} />

      {/* Places for selected day */}
      {eventsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : placesWithCoords.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-section-label">Places on this day</h2>
          <div className="space-y-2">
            {placesWithCoords.map((place) => (
              <Card key={place._id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {place.address}
                    </p>
                  </div>
                  {place.googleMapsUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs shrink-0 border-primary/20 text-primary hover:bg-primary/10"
                      asChild
                    >
                      <a
                        href={place.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Maps
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No places with coordinates for this day
        </p>
      )}
    </div>
  );
}
