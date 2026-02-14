import { useContext } from "react";
import { TripContext } from "./tripContextValue";

export function useTripContext() {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error("useTripContext must be used within a TripProvider");
  }
  return ctx;
}
