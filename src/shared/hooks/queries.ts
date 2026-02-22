import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Trip, Day, TripEvent, Place, Booking, Suggestion, Proposal } from "@/shared/types";
import {
  tripsApi,
  daysApi,
  eventsApi,
  placesApi,
  bookingsApi,
  suggestionsApi,
  proposalsApi,
} from "@/shared/api/client";
import type { ProposalFilters } from "@/shared/api/client";
import * as mockStore from "@/shared/api/mock-store";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true when a transit object has at least one meaningful field. */
function hasTransitContent(t?: Record<string, unknown>): boolean {
  if (!t) return false;
  return !!(t.mode || t.from || t.to || t.instructions);
}

// ─── Trips ───────────────────────────────────────────────────────────────────

export function useTrips(enabled = true) {
  return useQuery<Trip[]>({
    queryKey: ["trips", useMocks],
    queryFn: () =>
      useMocks
        ? Promise.resolve(mockStore.listTrips())
        : tripsApi.list(),
    enabled,
  });
}

export function useTrip(tripId: string) {
  return useQuery<Trip>({
    queryKey: ["trip", tripId, useMocks],
    queryFn: () => {
      if (useMocks) {
        const t = mockStore.getTrip(tripId);
        if (!t) throw new Error("Trip not found");
        return Promise.resolve(t);
      }
      return tripsApi.get(tripId);
    },
    enabled: !!tripId,
  });
}

export function useCollaborators(tripId: string) {
  return useQuery({
    queryKey: ["collaborators", tripId],
    queryFn: () => tripsApi.collaborators(tripId),
    enabled: !!tripId && !useMocks,
  });
}

export function useShareLinks(tripId: string) {
  return useQuery({
    queryKey: ["share-links", tripId],
    queryFn: () => tripsApi.shareLinks(tripId),
    enabled: !!tripId && !useMocks,
  });
}

// ─── Days ────────────────────────────────────────────────────────────────────

/**
 * Fetches all days for a trip. Computes `dayNumber` (1-indexed) from
 * the sorted position since the backend returns them sorted by date asc.
 */
export function useDays(tripId: string) {
  return useQuery<Day[]>({
    queryKey: ["days", tripId],
    queryFn: async () => {
      const raw = await daysApi.list(tripId);
      return raw.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    },
    enabled: !!tripId,
  });
}

/**
 * Gets a single day by ID. Uses the days-list cache when available
 * so that `dayNumber` is pre-computed.
 */
export function useDay(dayId: string, tripId?: string) {
  // Prefer the trip-level days cache (has dayNumber computed)
  const { data: days } = useDays(tripId ?? "");

  const fromCache = days?.find((d) => d._id === dayId);

  // Fallback: fetch the single day (won't have dayNumber yet)
  const singleQuery = useQuery({
    queryKey: ["day", dayId],
    queryFn: async () => {
      const raw = await daysApi.get(dayId);
      return { ...raw, dayNumber: raw.order ?? 0 } as Day;
    },
    enabled: !!dayId && !fromCache,
  });

  return {
    data: fromCache ?? singleQuery.data,
    isLoading: tripId ? !days && !fromCache : singleQuery.isLoading,
  };
}

// ─── Places ──────────────────────────────────────────────────────────────────

export function usePlaces(tripId: string, query?: string) {
  return useQuery<Place[]>({
    queryKey: ["places", tripId, query],
    queryFn: () => placesApi.list(tripId, query),
    enabled: !!tripId,
  });
}

/** Returns a Map<placeId, Place> for efficient lookup when enriching events. */
export function usePlacesMap(tripId: string) {
  const { data: places, isLoading } = usePlaces(tripId);

  const map = useMemo(() => {
    if (!places) return new Map<string, Place>();
    return new Map(places.map((p) => [p._id, p]));
  }, [places]);

  return { map, isLoading };
}

// ─── Events ──────────────────────────────────────────────────────────────────

/** Raw events for a day (no place enrichment). */
export function useEvents(dayId: string) {
  return useQuery<TripEvent[]>({
    queryKey: ["events", dayId],
    queryFn: async () => {
      const raw = await eventsApi.list(dayId);
      // Normalise: convert empty transit {} to undefined
      return raw.map((e) => ({
        ...e,
        transit: hasTransitContent(e.transit as unknown as Record<string, unknown>)
          ? e.transit
          : undefined,
      }));
    },
    enabled: !!dayId,
  });
}

/**
 * Events for a day, enriched with their linked Place objects.
 * This is the hook most screens should use.
 */
export function useEventsWithPlaces(dayId: string, tripId: string) {
  const { data: events, isLoading: eventsLoading } = useEvents(dayId);
  const { map: placesMap, isLoading: placesLoading } = usePlacesMap(tripId);

  const data = useMemo(() => {
    if (!events) return undefined;
    return events.map((evt) => ({
      ...evt,
      place: evt.placeId ? placesMap.get(evt.placeId) : undefined,
    }));
  }, [events, placesMap]);

  return {
    data,
    isLoading: eventsLoading || placesLoading,
  };
}

// ─── Today ───────────────────────────────────────────────────────────────────

/**
 * Returns the "today" day + its events (enriched with places).
 * Falls back to day-2 or day-1 when today's date doesn't match any day.
 */
export function useTodayData(tripId: string) {
  const { data: days, isLoading: daysLoading } = useDays(tripId);

  const today = new Date().toISOString().split("T")[0];
  const targetDay =
    days?.find((d) => d.date === today) ?? // exact match
    days?.[1] ??                           // day 2 fallback (demo)
    days?.[0];                             // day 1 fallback

  const {
    data: events,
    isLoading: eventsLoading,
  } = useEventsWithPlaces(targetDay?._id ?? "", tripId);

  return {
    data:
      targetDay && events
        ? { day: targetDay, events }
        : undefined,
    isLoading: daysLoading || eventsLoading,
  };
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export function useBookings(tripId: string) {
  return useQuery<Booking[]>({
    queryKey: ["bookings", tripId],
    queryFn: () => bookingsApi.list(tripId),
    enabled: !!tripId,
  });
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export function useSuggestions(tripId: string, city?: string) {
  return useQuery<Suggestion[]>({
    queryKey: ["suggestions", tripId, city],
    queryFn: () => suggestionsApi.list(tripId, city),
    enabled: !!tripId,
  });
}

// ─── Proposals ───────────────────────────────────────────────────────────────

export function useProposals(tripId: string, filters?: ProposalFilters) {
  return useQuery<Proposal[]>({
    queryKey: ["proposals", tripId, filters?.status, filters?.category],
    queryFn: () => proposalsApi.list(tripId, filters),
    enabled: !!tripId && !useMocks,
  });
}
