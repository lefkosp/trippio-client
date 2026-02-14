import type { Trip } from "@/shared/types";
import { TripContext } from "./tripContextValue";

export function TripProvider({
  trip,
  children,
}: {
  trip: Trip;
  children: React.ReactNode;
}) {
  return (
    <TripContext.Provider value={{ tripId: trip._id, trip }}>
      {children}
    </TripContext.Provider>
  );
}
