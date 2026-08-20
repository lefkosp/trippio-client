import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  daysApi,
  eventsApi,
  placesApi,
  bookingsApi,
  suggestionsApi,
  proposalsApi,
} from "@/shared/api/client";
import { hasTransitContent } from "@/shared/hooks/queries";
import type { Day, TripEvent } from "@/shared/types";

const PROPOSAL_STATUSES = ["open", "approved", "promoted", "rejected"] as const;

/**
 * Warms the query cache for everything a trip needs to render offline, once
 * per trip switch. Runs after the trip shell has already painted from
 * whatever's cached — this is a background top-up, not a loading gate.
 *
 * Per-day events piggyback on the single trip-wide events fetch instead of
 * firing one request per day, so `useEvents(dayId)` (day detail, itinerary)
 * still hits a warm cache without an N+1 fan-out.
 */
export function usePrefetchTripData(tripId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tripId || !enabled) return;
    let cancelled = false;

    async function warm() {
      try {
        await warmTripCache();
      } catch {
        // Best-effort background warm — a failure here just means the next
        // screen visit fetches normally instead of hitting a warm cache.
      }
    }

    async function warmTripCache() {
      const rawDays = await queryClient.fetchQuery({
        queryKey: ["days", tripId],
        queryFn: async () => {
          const raw = await daysApi.list(tripId!);
          return raw.map((d, i) => ({ ...d, dayNumber: i + 1 })) as Day[];
        },
      });
      if (cancelled) return;

      const events = await queryClient.fetchQuery({
        queryKey: ["events", "trip", tripId],
        queryFn: () => eventsApi.listByTrip(tripId!),
      });
      if (cancelled) return;

      const eventsByDay = new Map<string, TripEvent[]>();
      for (const event of events) {
        const list = eventsByDay.get(event.dayId) ?? [];
        list.push(event);
        eventsByDay.set(event.dayId, list);
      }
      for (const day of rawDays) {
        const normalized = (eventsByDay.get(day._id) ?? []).map((e) => ({
          ...e,
          transit: hasTransitContent(e.transit as unknown as Record<string, unknown>)
            ? e.transit
            : undefined,
        }));
        queryClient.setQueryData(["events", day._id], normalized);
      }

      queryClient.prefetchQuery({
        queryKey: ["places", tripId, undefined],
        queryFn: () => placesApi.list(tripId!),
      });

      queryClient.prefetchQuery({
        queryKey: ["bookings", tripId],
        queryFn: () => bookingsApi.list(tripId!),
      });

      for (const status of PROPOSAL_STATUSES) {
        queryClient.prefetchQuery({
          queryKey: ["proposals", tripId, status, undefined, undefined],
          queryFn: () => proposalsApi.list(tripId!, { status }),
        });
      }

      const cities = [...new Set(rawDays.map((d) => d.city).filter(Boolean))];
      for (const city of cities) {
        queryClient.prefetchQuery({
          queryKey: ["suggestions", tripId, city],
          queryFn: () => suggestionsApi.list(tripId!, city),
        });
      }
    }

    warm();
    return () => {
      cancelled = true;
    };
  }, [tripId, enabled, queryClient]);
}
