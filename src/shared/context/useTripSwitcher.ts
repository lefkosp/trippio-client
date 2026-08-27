import { useContext } from "react";
import { TripSwitcherContext } from "./TripSwitcherContext";

/** Split from the provider file so that file only exports components —
 *  same split as {@link ../../auth/useAuth}, and what keeps fast refresh working. */
export function useTripSwitcher() {
  const ctx = useContext(TripSwitcherContext);
  if (!ctx) {
    throw new Error("useTripSwitcher must be used within TripSwitcherProvider");
  }
  return ctx;
}
