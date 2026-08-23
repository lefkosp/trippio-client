import { Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { eventTypeConfig, transitSummary } from "@/shared/utils/event-helpers";
import { PlaceName } from "@/components/place-name";
import { MetroLine, AdvanceBookingNote } from "@/components/place-meta";
import { formatDuration } from "../timeline";
import type { TripEvent } from "@/shared/types";

interface EventCardProps {
  event: TripEvent;
  onClick: () => void;
  /** When set and equal to event._id, applies a brief highlight animation. */
  highlightEventId?: string | null;
  startMinutes?: number | null;
  durationMinutes?: number | null;
  /** False for the final stop, so the rail stops rather than trailing off. */
  continuesBelow?: boolean;
}

/**
 * One stop on the day's timeline.
 *
 * The time lives in its own left gutter in tabular mono, so a column of stops
 * reads as a schedule — times line up, and you can scan down them without
 * reading the titles. The rail and its dot sit between the gutter and the
 * content; the dot takes the event type's signage colour.
 */
export function EventCard({
  event,
  onClick,
  highlightEventId,
  startMinutes,
  durationMinutes,
  continuesBelow = true,
}: EventCardProps) {
  const config = eventTypeConfig[event.type];
  const isHighlight = highlightEventId != null && highlightEventId === event._id;
  const transit = transitSummary(event.transit);
  const isDone = event.status === "done";
  const isSkipped = event.status === "skipped";
  const muted = isDone || isSkipped;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left grid grid-cols-[3.25rem_auto_1fr] gap-x-3 group",
        isHighlight && "event-highlight-flash rounded-[3px]",
      )}
    >
      {/* Time gutter */}
      <div className="text-data text-[11px] text-muted-foreground pt-0.5 text-right tabular">
        {event.startTime || "—"}
      </div>

      {/* Rail + dot */}
      <div className="flex flex-col items-center w-3">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 bg-current",
            muted ? "text-muted-foreground/50" : config.fgClass,
          )}
          aria-hidden="true"
        />
        {continuesBelow && (
          <span className="w-px flex-1 bg-border mt-1" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "min-w-0 pb-5 space-y-1 rounded-[3px] px-1.5 -mx-1.5 transition-colors",
          "group-hover:bg-foreground/[0.03] group-active:bg-foreground/[0.05]",
        )}
      >
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "font-medium text-sm leading-snug flex-1 min-w-0",
              muted && "text-muted-foreground",
              isSkipped && "line-through",
            )}
          >
            {event.title}
          </p>
          {isDone && (
            <span className="seal-stamp shrink-0 mt-0.5">Done</span>
          )}
          {isSkipped && (
            <span className="badge-subtle bg-elev-2 text-muted-foreground shrink-0">
              Skipped
            </span>
          )}
          {event.source === "proposal" && !muted && (
            <span className="badge-subtle bg-elev-2 text-muted-foreground shrink-0">
              From an idea
            </span>
          )}
        </div>

        {durationMinutes != null && (
          <p className="text-data text-[11px] text-muted-foreground">
            {formatDuration(durationMinutes)}
            {event.endTime && ` · ends ${event.endTime}`}
          </p>
        )}
        {durationMinutes == null && event.endTime && startMinutes != null && (
          <p className="text-data text-[11px] text-muted-foreground">
            until {event.endTime}
          </p>
        )}

        {event.place && <PlaceName place={event.place} className="text-xs text-muted-foreground" />}
        <MetroLine place={event.place} />
        <AdvanceBookingNote place={event.place} />

        {transit && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Route className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate capitalize">{transit}</span>
          </div>
        )}
      </div>
    </button>
  );
}
