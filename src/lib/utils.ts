import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
