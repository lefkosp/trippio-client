import type { EventType, EventStatus, TripEvent } from "@/shared/types";
import {
  Landmark,
  UtensilsCrossed,
  TrainFront,
  BedDouble,
  Flag,
  type LucideIcon,
} from "lucide-react";

export const eventTypeConfig: Record<
  EventType,
  { label: string; icon: LucideIcon; bgClass: string; fgClass: string }
> = {
  sight: {
    label: "Sight",
    icon: Landmark,
    bgClass: "bg-event-sight",
    fgClass: "text-event-sight-foreground",
  },
  food: {
    label: "Food",
    icon: UtensilsCrossed,
    bgClass: "bg-event-food",
    fgClass: "text-event-food-foreground",
  },
  transport: {
    label: "Transport",
    icon: TrainFront,
    bgClass: "bg-event-transport",
    fgClass: "text-event-transport-foreground",
  },
  hotel: {
    label: "Hotel",
    icon: BedDouble,
    bgClass: "bg-event-hotel",
    fgClass: "text-event-hotel-foreground",
  },
  free: {
    label: "Free",
    icon: Flag,
    bgClass: "bg-event-free",
    fgClass: "text-event-free-foreground",
  },
};

export const eventStatusConfig: Record<
  EventStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  planned: { label: "Planned", variant: "outline" },
  done: { label: "Done", variant: "default" },
  skipped: { label: "Skipped", variant: "secondary" },
};

/** The one-line summary to show for a transit leg on a compact card.
 *
 * `transit` is often present with only `mode` set (that's how most of the China
 * 2026 events came in), so rendering `instructions` unconditionally leaves a
 * route icon followed by an empty string. Fall back through what's actually
 * there, and return null when there's nothing worth a row. */
export function transitSummary(transit?: TripEvent["transit"]): string | null {
  if (!transit) return null;
  if (transit.instructions?.trim()) return transit.instructions.trim();
  if (transit.from && transit.to) return `${transit.from} → ${transit.to}`;
  if (transit.from || transit.to) return (transit.from || transit.to) as string;
  if (transit.mode) return transit.mode;
  return null;
}

export function formatTime(time?: string): string {
  if (!time) return "";
  // If already "HH:mm" format, return as-is
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  // Try to parse ISO
  try {
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return time;
  }
}
