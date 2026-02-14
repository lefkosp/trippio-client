import { createContext, useContext, type ReactNode } from "react";
import type { Trip } from "@/shared/types";

export interface TripSwitcherContextValue {
  trips: Trip[];
  selectedTripId: string | null;
  setSelectedTripId: (id: string) => void;
}

export const TripSwitcherContext = createContext<TripSwitcherContextValue | null>(null);

export function TripSwitcherProvider({
  trips,
  selectedTripId,
  setSelectedTripId,
  children,
}: {
  trips: Trip[];
  selectedTripId: string | null;
  setSelectedTripId: (id: string) => void;
  children: ReactNode;
}) {
  const value: TripSwitcherContextValue = {
    trips,
    selectedTripId,
    setSelectedTripId,
  };
  return (
    <TripSwitcherContext.Provider value={value}>
      {children}
    </TripSwitcherContext.Provider>
  );
}

export function useTripSwitcher() {
  const ctx = useContext(TripSwitcherContext);
  if (!ctx) {
    throw new Error("useTripSwitcher must be used within TripSwitcherProvider");
  }
  return ctx;
}
