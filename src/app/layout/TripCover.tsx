import { useMemo } from "react";
import { formatDate, parseDateOnly } from "@/lib/utils";
import { buildCityColorMap } from "@/lib/cityColor";
import type { Day, Trip } from "@/shared/types";

interface Leg {
  city: string;
  from: string;
  to: string;
  days: number;
  fgClass: string;
}

/** Group consecutive days into city legs — "Beijing, 22–27 Oct", the way you'd
 *  describe the trip out loud, rather than sixteen equally-weighted rows. */
function buildLegs(days: Day[] | undefined, colors: ReturnType<typeof buildCityColorMap>): Leg[] {
  if (!days?.length) return [];
  const legs: Leg[] = [];
  for (const day of days) {
    const city = day.city?.trim();
    if (!city) continue;
    const last = legs[legs.length - 1];
    if (last && last.city === city) {
      last.to = day.date;
      last.days += 1;
    } else {
      legs.push({
        city,
        from: day.date,
        to: day.date,
        days: 1,
        fgClass: colors.get(city)?.fgClass ?? "text-muted-foreground",
      });
    }
  }
  return legs;
}

/** Where the trip is relative to today, in the words you'd actually use. */
function tripStatus(trip: Trip, dayCount: number) {
  const start = parseDateOnly(trip.startDate);
  const end = parseDateOnly(trip.endDate);
  if (!start || !end) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 1000 * 60 * 60 * 24;

  if (today < start) {
    const out = Math.round((start.getTime() - today.getTime()) / dayMs);
    return { value: String(out), label: out === 1 ? "day to go" : "days to go" };
  }
  if (today > end) {
    return { value: "—", label: "trip ended" };
  }
  const n = Math.round((today.getTime() - start.getTime()) / dayMs) + 1;
  return { value: String(n), label: `of ${dayCount || "?"} today` };
}

/**
 * The trip, given a face.
 *
 * Until now "China 2026" was 14px of muted text in the top bar: no dates, no
 * countdown, no sense that it's three cities and four people. That's the
 * emotional centre of the whole product and it wasn't rendered anywhere.
 */
export function TripCover({ trip, days }: { trip: Trip; days?: Day[] }) {
  const colors = useMemo(
    () => buildCityColorMap(days?.map((d) => d.city) ?? []),
    [days],
  );
  const legs = useMemo(() => buildLegs(days, colors), [days, colors]);
  const dayCount = days?.length ?? 0;
  const status = tripStatus(trip, dayCount);
  const people = (trip.collaborators?.length ?? 0) || 1;

  return (
    <div className="relative rounded-lg border border-border bg-elev-1 px-4 pt-5 pb-4 overflow-hidden">
      <span
        className="seal-mark absolute top-4 right-4 h-11 w-11 text-lg"
        aria-hidden="true"
      >
        T
      </span>

      <p className="text-section-label">Trip</p>
      <h2 className="text-numeral text-[2.6rem] mt-2 pr-14 break-words">
        {trip.name}
      </h2>

      <div className="flex gap-6 mt-4">
        {status && (
          <div>
            <div className="text-numeral text-[1.6rem]">{status.value}</div>
            <div className="text-section-label mt-1">{status.label}</div>
          </div>
        )}
        <div>
          <div className="text-numeral text-[1.6rem]">{dayCount || "—"}</div>
          <div className="text-section-label mt-1">days</div>
        </div>
        <div>
          <div className="text-numeral text-[1.6rem]">{legs.length || "—"}</div>
          <div className="text-section-label mt-1">
            {legs.length === 1 ? "stop" : "stops"}
          </div>
        </div>
        <div>
          <div className="text-numeral text-[1.6rem]">{people}</div>
          <div className="text-section-label mt-1">
            {people === 1 ? "traveller" : "travellers"}
          </div>
        </div>
      </div>

      {legs.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
          {legs.map((leg) => (
            <li key={`${leg.city}-${leg.from}`} className="flex items-center gap-3">
              <span
                className={`w-1 h-6 rounded-[1px] shrink-0 bg-current ${leg.fgClass}`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium truncate flex-1">
                {leg.city}
              </span>
              <span className="text-data text-[11px] text-muted-foreground shrink-0">
                {formatDate(leg.from, { month: "short", day: "numeric" })}
                {leg.from !== leg.to &&
                  ` – ${formatDate(leg.to, { month: "short", day: "numeric" })}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {legs.length === 0 && (
        <p className="text-caption mt-5 border-t border-border pt-4">
          {formatDate(trip.startDate, { month: "long", day: "numeric" })} –{" "}
          {formatDate(trip.endDate, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
