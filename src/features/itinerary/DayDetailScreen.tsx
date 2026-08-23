import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, PackageOpen, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDay, useDays, useEventsWithPlaces, useSuggestions } from "@/shared/hooks/queries";
import { useCreateEvent } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { useAuth } from "@/auth/useAuth";
import { formatDate } from "@/lib/utils";
import { buildCityColorMap } from "@/lib/cityColor";
import { EventCard } from "./components/EventCard";
import { EventSheet } from "./components/EventSheet";
import { AddEventSheet } from "./components/AddEventSheet";
import { PartHeading, GapRow, NowRow } from "./components/TimelineRows";
import { buildTimeline, dayPartLabel, nowMinutesFor } from "./timeline";
import type { TripEvent, Suggestion } from "@/shared/types";

function SuggestionCard({
  suggestion,
  onAdd,
  isAdding,
  isReadOnly,
}: {
  suggestion: Suggestion;
  onAdd: () => void;
  isAdding: boolean;
  isReadOnly: boolean;
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
      {!isReadOnly && (
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
      )}
    </div>
  );
}

export function DayDetailScreen() {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const highlightEventId = (location.state as { highlightEventId?: string } | null)?.highlightEventId;
  const { tripId } = useTripContext();
  const { isReadOnly } = useAuth();

  const { data: day, isLoading: dayLoading } = useDay(dayId ?? "", tripId);
  const { data: events, isLoading: eventsLoading } = useEventsWithPlaces(dayId ?? "", tripId);
  const { data: suggestions } = useSuggestions(tripId, day?.city);
  const createEvent = useCreateEvent(dayId ?? "");

  // Same query cache useDay() already reads from — no extra fetch — used
  // here to build the same city → colour assignment ItineraryScreen uses,
  // so a city's badge is the same colour everywhere it appears, and to
  // find this day's neighbours for the prev/next day buttons.
  const { data: days } = useDays(tripId);
  const cityColors = useMemo(
    () => buildCityColorMap(days?.map((d) => d.city) ?? []),
    [days]
  );
  const dayIndex = days?.findIndex((d) => d._id === dayId) ?? -1;
  const prevDay = dayIndex > 0 ? days?.[dayIndex - 1] : undefined;
  const nextDay =
    dayIndex >= 0 && days && dayIndex < days.length - 1 ? days[dayIndex + 1] : undefined;

  const timeline = useMemo(
    () => buildTimeline(events ?? [], nowMinutesFor(day?.date)),
    [events, day?.date],
  );

  const [selectedEvent, setSelectedEvent] = useState<TripEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(null);

  // The route doesn't remount when flipping to a neighbouring day (same
  // element, just a new :dayId param), so any sheet left open would keep
  // showing an event from the day we just navigated away from.
  useEffect(() => {
    setSheetOpen(false);
    setSelectedEvent(null);
    setAddSheetOpen(false);
  }, [dayId]);

  const handleEventClick = (event: TripEvent) => {
    setSelectedEvent(event);
    setSheetOpen(true);
  };

  // Re-derive from the live query result so the sheet reflects mutations
  // (status changes, edits) made while it's open, instead of the stale
  // snapshot captured at the moment the card was clicked.
  const liveSelectedEvent =
    events?.find((e) => e._id === selectedEvent?._id) ?? selectedEvent;

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

  const dateStr = formatDate(day.date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const cityConfig = day.city ? cityColors.get(day.city) : undefined;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-6 pb-3 glass border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate("/itinerary")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground press-scale transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All days
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevDay && navigate(`/itinerary/${prevDay._id}`)}
              disabled={!prevDay}
              aria-label="Previous day"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-elev-2 disabled:opacity-30 disabled:pointer-events-none press-scale transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => nextDay && navigate(`/itinerary/${nextDay._id}`)}
              disabled={!nextDay}
              aria-label="Next day"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-elev-2 disabled:opacity-30 disabled:pointer-events-none press-scale transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-numeral text-[3.4rem]">
            {String(day.dayNumber).padStart(2, "0")}
          </span>
          <div className="pb-1 min-w-0">
            {cityConfig && (
              <span className={`badge-subtle ${cityConfig.bgClass} ${cityConfig.fgClass}`}>
                {day.city}
              </span>
            )}
            <p className="text-data text-[11px] text-muted-foreground mt-1">
              {dateStr}
            </p>
          </div>
        </div>
        {day.notes && (
          <p className="text-caption italic mt-2">{day.notes}</p>
        )}
      </div>

      {/* Timeline */}
      {events && events.length > 0 ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {timeline.map((row, i) => {
            if (row.kind === "part")
              return <PartHeading key={row.key} label={dayPartLabel[row.part]} />;
            if (row.kind === "gap")
              return <GapRow key={row.key} minutes={row.minutes} />;
            if (row.kind === "now") return <NowRow key={row.key} />;
            return (
              <EventCard
                key={row.key}
                event={row.event}
                onClick={() => handleEventClick(row.event)}
                highlightEventId={highlightEventId}
                startMinutes={row.startMinutes}
                durationMinutes={row.durationMinutes}
                continuesBelow={timeline
                  .slice(i + 1)
                  .some((r) => r.kind === "stop")}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-3">
            <PackageOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">This day is still empty</p>
          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setAddSheetOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add your first event
            </Button>
          )}
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
                  isReadOnly={isReadOnly}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating add button. Anchored to the app column, not the viewport —
          `right-4` on a fixed element put it hundreds of pixels away from the
          content it belongs to on any wide screen. */}
      {!isReadOnly && (
        <div className="fixed inset-x-0 bottom-24 z-40 pointer-events-none">
          <div className="max-w-md mx-auto px-4 flex justify-end">
            <Button
              size="lg"
              aria-label="Add an event"
              className="pointer-events-auto rounded-full shadow-lg h-12 w-12 p-0 bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
              onClick={() => setAddSheetOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Event detail sheet */}
      <EventSheet
        event={liveSelectedEvent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        dayId={dayId ?? ""}
      />

      {/* Add event sheet */}
      {!isReadOnly && (
        <AddEventSheet
          dayId={dayId ?? ""}
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
        />
      )}
    </div>
  );
}
