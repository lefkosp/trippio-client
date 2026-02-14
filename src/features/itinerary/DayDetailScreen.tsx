import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PackageOpen, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDay, useEventsWithPlaces, useSuggestions } from "@/shared/hooks/queries";
import { useCreateEvent } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { EventCard } from "./components/EventCard";
import { EventSheet } from "./components/EventSheet";
import { AddEventSheet } from "./components/AddEventSheet";
import type { TripEvent, Suggestion } from "@/shared/types";

const cityBadgeConfig: Record<string, { bgClass: string; fgClass: string }> = {
  Tokyo: { bgClass: "bg-city-tokyo", fgClass: "text-city-tokyo-foreground" },
  Kyoto: { bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
  Osaka: { bgClass: "bg-city-osaka", fgClass: "text-city-osaka-foreground" },
};

function SuggestionCard({
  suggestion,
  onAdd,
  isAdding,
}: {
  suggestion: Suggestion;
  onAdd: () => void;
  isAdding: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 px-2">
      <div className="h-8 w-8 rounded-lg bg-warning flex items-center justify-center shrink-0">
        <Lightbulb className="h-3.5 w-3.5 text-warning-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{suggestion.title}</p>
        {suggestion.why && (
          <p className="text-xs text-muted-foreground mt-0.5">{suggestion.why}</p>
        )}
        {suggestion.type && (
          <span className="badge-subtle bg-elev-2 text-muted-foreground mt-1.5 inline-flex">
            {suggestion.type}
          </span>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs shrink-0 border-primary/30 text-primary hover:bg-primary/10 press-scale"
        onClick={onAdd}
        disabled={isAdding}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  );
}

export function DayDetailScreen() {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  const { tripId } = useTripContext();

  const { data: day, isLoading: dayLoading } = useDay(dayId ?? "", tripId);
  const { data: events, isLoading: eventsLoading } = useEventsWithPlaces(dayId ?? "", tripId);
  const { data: suggestions } = useSuggestions(tripId, day?.city);
  const createEvent = useCreateEvent(dayId ?? "");

  const [selectedEvent, setSelectedEvent] = useState<TripEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(null);

  const handleEventClick = (event: TripEvent) => {
    setSelectedEvent(event);
    setSheetOpen(true);
  };

  const handleAddFromSuggestion = (suggestion: Suggestion) => {
    setAddingSuggestionId(suggestion._id);
    createEvent.mutate(
      {
        title: suggestion.title,
        type: (suggestion.type as TripEvent["type"]) ?? "sight",
        placeId: suggestion.placeId ?? undefined,
      },
      {
        onSuccess: () => setAddingSuggestionId(null),
        onError: () => setAddingSuggestionId(null),
      }
    );
  };

  if (dayLoading || eventsLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!day) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Day not found</p>
      </div>
    );
  }

  const dateStr = new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const cityConfig = cityBadgeConfig[day.city];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/itinerary")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 press-scale transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Itinerary
        </button>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-page-title">Day {day.dayNumber}</h1>
          {cityConfig && (
            <span className={`badge-subtle ${cityConfig.bgClass} ${cityConfig.fgClass}`}>
              {day.city}
            </span>
          )}
        </div>
        <p className="text-caption">{dateStr}</p>
        {day.notes && (
          <p className="text-caption italic mt-1">{day.notes}</p>
        )}
      </div>

      {/* Timeline */}
      {events && events.length > 0 ? (
        <div className="space-y-0">
          {events.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              onClick={() => handleEventClick(event)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-3">
            <PackageOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No events planned yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setAddSheetOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add your first event
          </Button>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-warning-foreground" />
            <h2 className="text-section-label">Suggestions for {day.city}</h2>
          </div>
          <Card>
            <CardContent className="p-2 divide-y divide-border">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s._id}
                  suggestion={s}
                  onAdd={() => handleAddFromSuggestion(s)}
                  isAdding={addingSuggestionId === s._id}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating add button */}
      <div className="fixed bottom-20 right-4 max-w-md">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-12 w-12 p-0 bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
          onClick={() => setAddSheetOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Event detail sheet */}
      <EventSheet
        event={selectedEvent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        dayId={dayId ?? ""}
      />

      {/* Add event sheet */}
      <AddEventSheet
        dayId={dayId ?? ""}
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
      />
    </div>
  );
}
