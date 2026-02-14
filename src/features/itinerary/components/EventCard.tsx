import { Clock, MapPin, Route } from "lucide-react";
import { eventTypeConfig } from "@/shared/utils/event-helpers";
import type { TripEvent } from "@/shared/types";

interface EventCardProps {
  event: TripEvent;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const config = eventTypeConfig[event.type];
  const TypeIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex gap-3 py-3.5 px-2 hover-lift rounded-lg transition-colors"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center pt-1.5">
        <div className={`h-3 w-3 rounded-full ${config.bgClass} border-2 border-current ${config.fgClass}`} />
        <div className="flex-1 w-px bg-border mt-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center h-6 w-6 rounded-md ${config.bgClass}`}>
            <TypeIcon className={`h-3 w-3 ${config.fgClass}`} />
          </div>
          <p className="font-medium text-sm truncate flex-1">{event.title}</p>
          {event.status === "done" && (
            <span className="badge-subtle bg-success text-success-foreground">Done</span>
          )}
        </div>

        {event.startTime && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {event.startTime}
              {event.endTime && ` — ${event.endTime}`}
            </span>
          </div>
        )}

        {event.place && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.place.name}</span>
          </div>
        )}

        {event.transit && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mt-0.5">
            <Route className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.transit.instructions}</span>
          </div>
        )}
      </div>
    </button>
  );
}
