import type { ProposalCategory } from "@/shared/types";
import { Utensils, Zap, BedDouble, Bus, MoreHorizontal, type LucideIcon } from "lucide-react";

export const CATEGORY_CONFIG: Record<
  ProposalCategory,
  { label: string; icon: LucideIcon; bgClass: string; fgClass: string }
> = {
  food: {
    label: "Food",
    icon: Utensils,
    bgClass: "bg-booking-activity",
    fgClass: "text-booking-activity-foreground",
  },
  activity: {
    label: "Activity",
    icon: Zap,
    bgClass: "bg-booking-train",
    fgClass: "text-booking-train-foreground",
  },
  stay: {
    label: "Stay",
    icon: BedDouble,
    bgClass: "bg-booking-hotel",
    fgClass: "text-booking-hotel-foreground",
  },
  transport: {
    label: "Transport",
    icon: Bus,
    bgClass: "bg-booking-flight",
    fgClass: "text-booking-flight-foreground",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    bgClass: "bg-booking-other",
    fgClass: "text-booking-other-foreground",
  },
};

export const CATEGORIES: ProposalCategory[] = ["food", "activity", "stay", "transport", "other"];
