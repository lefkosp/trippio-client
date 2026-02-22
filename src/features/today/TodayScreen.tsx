import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  Flag,
  Route,
  CalendarDays,
  Ticket,
  Map,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayData, useProposals } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import { eventTypeConfig } from "@/shared/utils/event-helpers";
import { formatDate } from "@/lib/utils";
import type { TripEvent } from "@/shared/types";

function NextUpCard({ event }: { event: TripEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

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
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{event.place.name}</span>
            {event.place.googleMapsUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                asChild
              >
                <a
                  href={event.place.googleMapsUrl}
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

function EventRow({ event }: { event: TripEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0 hover-lift cursor-pointer rounded-lg px-1">
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-lg ${config.bgClass}`}
      >
        <Icon className={`h-3.5 w-3.5 ${config.fgClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{event.title}</p>
        {event.startTime && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {event.startTime}
          </p>
        )}
      </div>
      {event.status === "done" && (
        <span className="badge-subtle bg-success text-success-foreground">
          Done
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
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
      <div className="space-y-5">
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
      <div className="space-y-6">
        {openCount > 0 && (
          <Card className="bg-elev-1 border-border">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Open proposals</p>
                  <p className="text-xs text-muted-foreground">
                    {openCount} {openCount === 1 ? "idea" : "ideas"} waiting for votes
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate("/proposals?status=open")}
              >
                Review
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-4">
            <Flag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No events today</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Enjoy a free day or add something to your plan.
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
      <div className="space-y-1">
        <h1 className="text-page-title">
          Day {day.dayNumber} — {day.city}
        </h1>
        <p className="text-caption">
          {formatDate(day.date, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        {day.notes && (
          <p className="text-caption italic mt-0.5">{day.notes}</p>
        )}
      </div>

      {/* Open proposals card */}
      {openCount > 0 && (
        <Card className="bg-elev-1 border-border">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Open proposals</p>
                <p className="text-xs text-muted-foreground">
                  {openCount} {openCount === 1 ? "idea" : "ideas"} waiting for votes
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate("/proposals?status=open")}
            >
              Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next up card */}
      {nextEvent && <NextUpCard event={nextEvent} />}

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 border-border text-muted-foreground hover:text-foreground hover:bg-elev-2 press-scale"
          onClick={() => navigate(`/itinerary/${day._id}`)}
        >
          <CalendarDays className="h-4 w-4 mr-1.5" />
          Day View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 border-border text-muted-foreground hover:text-foreground hover:bg-elev-2 press-scale"
          onClick={() => navigate("/map")}
        >
          <Map className="h-4 w-4 mr-1.5" />
          Map
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 border-border text-muted-foreground hover:text-foreground hover:bg-elev-2 press-scale"
          onClick={() => navigate("/bookings")}
        >
          <Ticket className="h-4 w-4 mr-1.5" />
          Bookings
        </Button>
      </div>

      {/* Rest of events */}
      {restEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-section-label">Later Today</h2>
          <Card>
            <CardContent className="p-3">
              {restEvents.map((event) => (
                <EventRow key={event._id} event={event} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* View full day button */}
      <Button
        variant="outline"
        className="w-full border-primary/20 text-primary hover:bg-primary/10"
        onClick={() => navigate(`/itinerary/${day._id}`)}
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        View Full Day Plan
        <ChevronRight className="h-4 w-4 ml-auto" />
      </Button>
    </div>
  );
}
