import type { TripEvent } from "@/shared/types";

export type DayPart = "morning" | "afternoon" | "evening";

export const dayPartLabel: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

/** "HH:mm" → minutes past midnight. Null for anything unparseable or absent. */
export function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function dayPartOf(minutes: number): DayPart {
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

/** "3h 45m", "45 min", "1h" — the way you'd say it, not "225 minutes". */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export type TimelineRow =
  | { kind: "part"; part: DayPart; key: string }
  | { kind: "now"; key: string }
  | { kind: "gap"; minutes: number; key: string }
  | {
      kind: "stop";
      event: TripEvent;
      startMinutes: number | null;
      durationMinutes: number | null;
      key: string;
    };

/**
 * Turn a day's events into rows that make time visible.
 *
 * The old timeline rendered every event at identical height with an identical
 * dot, so an hour at Tiananmen and four hours in the Forbidden City looked the
 * same and the gap between them didn't exist at all. Here the gaps are rows in
 * their own right, each stop carries its duration, and the parts of the day get
 * headings — so scanning the screen tells you how the day is actually shaped.
 *
 * Events without a start time still render, in their given order; they just
 * don't open a new part or produce a gap, since there's nothing to measure.
 *
 * @param nowMinutes minutes past midnight, or null when this isn't today —
 *   drives the "now" marker, which is the one thing a travel-mode timeline
 *   genuinely needs and didn't have.
 */
export function buildTimeline(
  events: TripEvent[],
  nowMinutes: number | null = null,
): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let currentPart: DayPart | null = null;
  let prevEndMinutes: number | null = null;
  let nowPlaced = nowMinutes == null;

  for (const event of events) {
    const startMinutes = toMinutes(event.startTime);
    const endMinutes = toMinutes(event.endTime);
    const durationMinutes =
      startMinutes != null && endMinutes != null && endMinutes > startMinutes
        ? endMinutes - startMinutes
        : null;

    if (startMinutes != null) {
      // "Now" comes before the gap and the part heading that lead into the next
      // stop, because both of those describe time that is still ahead of you.
      // Emitting it after them put a 10:00 marker underneath an "Afternoon"
      // rule, which is just wrong.
      if (!nowPlaced && nowMinutes != null && startMinutes > nowMinutes) {
        rows.push({ kind: "now", key: "now" });
        nowPlaced = true;
      }

      // Gap, then any part heading: an hour free that happens to straddle noon
      // is still an hour free, and it belongs above the "Afternoon" rule rather
      // than being swallowed by it.
      if (prevEndMinutes != null) {
        const gap = startMinutes - prevEndMinutes;
        // Under half an hour isn't a gap worth drawing — it's just walking.
        if (gap >= 30) {
          rows.push({ kind: "gap", minutes: gap, key: `gap-${event._id}` });
        }
      }

      const part = dayPartOf(startMinutes);
      if (part !== currentPart) {
        rows.push({ kind: "part", part, key: `part-${part}` });
        currentPart = part;
      }
    }

    rows.push({
      kind: "stop",
      event,
      startMinutes,
      durationMinutes,
      key: event._id,
    });

    prevEndMinutes = endMinutes ?? startMinutes ?? prevEndMinutes;
  }

  // Every stop is already behind us — the day is done, so the marker belongs
  // at the end rather than being dropped.
  if (!nowPlaced) rows.push({ kind: "now", key: "now" });

  return rows;
}

/** Minutes past midnight right now, but only when `date` is today —
 *  otherwise there's no "now" to mark on this day. */
export function nowMinutesFor(date: string | undefined): number | null {
  if (!date) return null;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date.slice(0, 10) !== today) return null;
  return now.getHours() * 60 + now.getMinutes();
}
