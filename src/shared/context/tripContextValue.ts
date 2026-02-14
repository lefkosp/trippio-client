import { createContext } from "react";
import type { Trip } from "@/shared/types";

export interface TripContextValue {
  tripId: string;
  trip: Trip;
}

export const TripContext = createContext<TripContextValue | null>(null);
