import { TrainFront, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/shared/types";

/**
 * Pull line numbers out of the free-text `metroLine` field.
 *
 * Real values look like "Line 1", "Line 8 / Line 5", "Line 2 / Line 1 / Line 6"
 * or "". Anything without a number (or an explicit "N/A") isn't a line we can
 * put in a bullet, so it's dropped rather than rendered as a wide text blob.
 */
function parseLines(metroLine?: string): string[] {
  if (!metroLine) return [];
  return metroLine
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== "n/a")
    .map((part) => part.match(/(\d+[A-Za-z]?)/)?.[1])
    .filter((n): n is string => Boolean(n));
}

function cleanStation(metroStation?: string): string | null {
  const s = metroStation?.trim();
  if (!s || s.toLowerCase() === "n/a") return null;
  return s;
}

/**
 * The nearest metro, as a numbered bullet and a station name — the way it's
 * printed on the station wall.
 *
 * The bullets are deliberately neutral rather than tinted: Beijing Line 8 is
 * green, Shanghai Line 8 is blue, and a confidently wrong colour is worse than
 * no colour when someone is looking for a platform. Adding real per-city line
 * colours would need a city→line→colour table and is a nice thing to do later.
 */
export function MetroLine({
  place,
  className,
}: {
  place?: Place | null;
  className?: string;
}) {
  if (!place) return null;
  const lines = parseLines(place.metroLine);
  const station = cleanStation(place.metroStation);
  if (!lines.length && !station) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground min-w-0",
        className,
      )}
    >
      {lines.length > 0 ? (
        <span className="flex items-center gap-1 shrink-0">
          {lines.map((n) => (
            <span
              key={n}
              className="metro-bullet bg-elev-2 border border-border text-foreground"
              aria-label={`Metro line ${n}`}
            >
              {n}
            </span>
          ))}
        </span>
      ) : (
        <TrainFront className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      {station && <span className="truncate">{station}</span>}
    </div>
  );
}

/**
 * Advance-booking warning. `requiresAdvanceBooking` has been on the model
 * since the China research and never rendered anywhere — which is the worst
 * possible place for it, given the Forbidden City sells out days ahead.
 */
export function AdvanceBookingNote({
  place,
  className,
}: {
  place?: Place | null;
  className?: string;
}) {
  if (!place?.requiresAdvanceBooking) return null;
  const days = place.bookingWindowDays;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-warning-foreground",
        className,
      )}
    >
      <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {days
          ? `Book ahead — tickets open ${days} days before`
          : "Book ahead — this one sells out"}
      </span>
    </div>
  );
}
