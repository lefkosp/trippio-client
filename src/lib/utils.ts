import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The design system's own utilities all start with `text-` (`text-page-title`,
 * `text-zh`, `text-data`, …), which is also Tailwind's namespace for font-size
 * and text-colour. Stock tailwind-merge therefore reads them as conflicting
 * with a real `text-xs` or `text-muted-foreground` in the same `cn()` call and
 * silently drops ours — which is how `text-zh` went missing from PlaceName and
 * every Chinese name rendered in the fallback font.
 *
 * Registering them as their own group makes them non-conflicting with
 * Tailwind's, so they survive alongside a size or colour class.
 */
const twMerge = extendTailwindMerge<"trippio-type">({
  extend: {
    classGroups: {
      "trippio-type": [
        "text-display",
        "text-page-title",
        "text-numeral",
        "text-section-label",
        "text-body",
        "text-caption",
        "text-data",
        "text-zh",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a date from the API (YYYY-MM-DD or ISO string) to a Date for formatting.
 * The server may return dates as full ISO strings (e.g. "2026-03-20T00:00:00.000Z");
 * the client was appending "T00:00:00" which produced invalid strings when date was already ISO.
 */
export function parseDateOnly(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  const ymd = dateStr.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
  const d = new Date(ymd + "T00:00:00")
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(
  dateStr: string | undefined,
  options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }
): string {
  const d = parseDateOnly(dateStr)
  return d ? d.toLocaleDateString("en-US", options) : ""
}
