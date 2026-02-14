import type { EventType, EventStatus } from "@/shared/types";
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
