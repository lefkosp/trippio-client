import { createContext, type ReactNode } from "react";
import type { Trip } from "@/shared/types";

export interface TripSwitcherContextValue {
  trips: Trip[];
  selectedTripId: string | null;
  setSelectedTripId: (id: string) => void;
}

const TripSwitcherContext = createContext<TripSwitcherContextValue | null>(null);

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

export { TripSwitcherContext };
