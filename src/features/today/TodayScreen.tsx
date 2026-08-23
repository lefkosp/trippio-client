import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  Flag,
  Route,
  CalendarDays,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayData, useProposals } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import { eventTypeConfig } from "@/shared/utils/event-helpers";
import { formatDate } from "@/lib/utils";
import { mapLink } from "@/lib/mapLink";
import { PlaceName } from "@/components/place-name";
import { MetroLine, AdvanceBookingNote } from "@/components/place-meta";
import type { TripEvent } from "@/shared/types";

function NextUpCard({ event }: { event: TripEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;
  const placeMapLink = event.place ? mapLink(event.place) : null;

  return (
    <div className="card-hero rounded-xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-section-label">Next Up</span>
        <span className={`badge-subtle ${config.bgClass} ${config.fgClass}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold tracking-tight">{event.title}</h2>

      {/* Time + Place */}
      <div className="space-y-2">
        {event.startTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {event.startTime}
              {event.endTime && (
                <span className="text-muted-foreground">
                  {" "}
                  — {event.endTime}
                </span>
              )}
            </span>
          </div>
        )}
        {event.place && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <PlaceName place={event.place} tone="detail" className="flex-1" />
            {placeMapLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                asChild
              >
                <a
                  href={placeMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Maps
                </a>
              </Button>
            )}
          </div>
        )}
        <MetroLine place={event.place} className="pl-6 text-[13px]" />
        <AdvanceBookingNote place={event.place} className="pl-6 text-[13px]" />
      </div>

      {/* Transit */}
      {event.transit && (
        <div className="flex items-start gap-2.5 text-sm rounded-lg p-3 bg-elev-2/50 border border-border">
          <Route className="h-4 w-4 text-event-transport-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-section-label mb-1">Getting there</p>
            {event.transit.from && event.transit.to && (
              <p className="text-xs text-muted-foreground mb-0.5">
                {event.transit.from} → {event.transit.to}
              </p>
            )}
            {event.transit.instructions && (
              <p className="text-sm text-foreground">
                {event.transit.instructions}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Extracted because this block used to exist twice, verbatim, in both branches
 *  of TodayScreen — it would have drifted the first time either was edited. */
function OpenIdeasRow({
  count,
  onReview,
}: {
  count: number;
  onReview: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onReview}
      className="w-full flex items-center gap-3 rounded-[3px] border border-border bg-elev-1 px-4 py-3 text-left hover-lift"
    >
      <Lightbulb className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 text-sm">
        {count} {count === 1 ? "idea" : "ideas"} waiting on you
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </button>
  );
}

/** A later stop on today. Same time-in-a-gutter grammar as the day timeline,
 *  so the two screens read as the same system. */
function EventRow({ event }: { event: TripEvent }) {
  const config = eventTypeConfig[event.type];
  const isDone = event.status === "done";

  return (
    <div className="flex items-baseline gap-3 py-3 border-b border-border last:border-b-0">
      <span className="text-data text-[11px] text-muted-foreground w-11 shrink-0 tabular">
        {event.startTime || "—"}
      </span>
      <span
        className={`h-2 w-2 rounded-full shrink-0 bg-current self-center ${
          isDone ? "text-muted-foreground/50" : config.fgClass
        }`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${isDone ? "text-muted-foreground" : "font-medium"}`}
        >
          {event.title}
        </p>
        {event.place && (
          <PlaceName place={event.place} className="text-xs text-muted-foreground mt-0.5" />
        )}
      </div>
      {isDone && <span className="seal-stamp shrink-0">Done</span>}
    </div>
  );
}

export function TodayScreen() {
  const { tripId } = useTripContext();
  const navigate = useNavigate();
  const { data, isLoading } = useTodayData(tripId);
  const { data: openProposals = [] } = useProposals(tripId, { status: "open" });
  const openCount = openProposals.length;

  if (isLoading) {
    return (
      <div className="space-y-5 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="space-y-6 pt-6">
        <OpenIdeasRow count={openCount} onReview={() => navigate("/proposals?status=open")} />
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-4">
            <Flag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nothing planned today</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Good. Go wander — or open the day and add something.
          </p>
        </div>
      </div>
    );
  }

  const { day, events } = data;
  const [nextEvent, ...restEvents] = events;

  return (
    <div className="space-y-8">
      {/* Day header */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-6 pb-3 glass border-b border-border/50">
        <div className="flex items-end gap-3">
          <span className="text-numeral text-[3.4rem]">
            {String(day.dayNumber).padStart(2, "0")}
          </span>
          <div className="pb-1 min-w-0">
            {day.city && (
              <p className="text-display text-lg truncate">{day.city}</p>
            )}
            <p className="text-data text-[11px] text-muted-foreground mt-0.5">
              {formatDate(day.date, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        {day.notes && (
          <p className="text-caption italic mt-2">{day.notes}</p>
        )}
      </div>

      <OpenIdeasRow count={openCount} onReview={() => navigate("/proposals?status=open")} />

      {/* The one thing that matters: what you're doing next. */}
      {nextEvent && <NextUpCard event={nextEvent} />}

      {/* Rest of events */}
      {restEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-section-label">Later today</h2>
          <div className="border-t border-border">
            {restEvents.map((event) => (
              <EventRow key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* One route to the full day, not three. Map and Bookings already have
          their own homes and don't need shortcuts duplicated here. */}
      <Button
        variant="outline"
        className="w-full border-primary/20 text-primary hover:bg-primary/10"
        onClick={() => navigate(`/itinerary/${day._id}`)}
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        The whole day
        <ChevronRight className="h-4 w-4 ml-auto" />
      </Button>
    </div>
  );
}
