import { formatDuration } from "../timeline";

/** "Morning" / "Afternoon" / "Evening" — a rule across the day, so the shape of
 *  it is legible before you read a single event title. */
export function PartHeading({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[3.25rem_auto_1fr] gap-x-3 pt-1 pb-3">
      <div />
      <div className="w-3" />
      <div className="flex items-center gap-2.5">
        <span className="text-section-label">{label}</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * An explicit gap between two stops.
 *
 * The rail segment grows with the length of the gap so a four-hour hole in the
 * afternoon physically occupies more of the screen than a forty-minute one —
 * capped, because a genuinely empty evening shouldn't push the next stop off
 * the bottom of the phone.
 */
export function GapRow({ minutes }: { minutes: number }) {
  const height = Math.min(12 + minutes / 6, 56);

  return (
    <div className="grid grid-cols-[3.25rem_auto_1fr] gap-x-3">
      <div />
      <div className="flex justify-center w-3">
        <span
          className="w-px border-l border-dashed border-border"
          style={{ height }}
          aria-hidden="true"
        />
      </div>
      <div className="pb-2">
        <span className="text-data text-[11px] text-muted-foreground/70">
          {formatDuration(minutes)} free
        </span>
      </div>
    </div>
  );
}

/** Where you are in the day, right now. Only rendered when the day is today. */
export function NowRow() {
  return (
    <div className="grid grid-cols-[3.25rem_auto_1fr] gap-x-3 py-1.5">
      <div className="text-data text-[11px] text-primary text-right pt-px tabular">
        {new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className="flex justify-center w-3">
        <span
          className="h-2 w-2 rounded-full bg-primary mt-1"
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
          Now
        </span>
        <span className="h-px flex-1 bg-primary/40" aria-hidden="true" />
      </div>
    </div>
  );
}
