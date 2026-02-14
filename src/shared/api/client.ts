/**
 * API client — currently backed by the local mock store.
 *
 * When the Express backend is ready, replace each function body with the
 * commented-out HTTP `request()` call. The function signatures stay the same
 * so hooks / mutations don't need any changes.
 */

import type { Trip, Day, TripEvent, Place, Booking, Suggestion } from "@/shared/types";
import * as store from "./mock-store";

// ─── Async wrapper (keeps the Promise<T> contract) ──────────────────────────

function resolve<T>(fn: () => T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(fn()), 40));
}

// ─── Trips ──────────────────────────────────────────────────────────────────

export const tripsApi = {
  list: (): Promise<Trip[]> => resolve(() => store.listTrips()),
  get: (tripId: string): Promise<Trip> =>
    resolve(() => {
      const trip = store.getTrip(tripId);
      if (!trip) throw new Error("Trip not found");
      return trip;
    }),
  create: (_data: Partial<Trip>): Promise<Trip> =>
    Promise.reject(new Error("Not implemented in mock")),
};

// ─── Days ───────────────────────────────────────────────────────────────────

export const daysApi = {
  list: (tripId: string): Promise<Omit<Day, "dayNumber">[]> =>
    resolve(() => store.listDays(tripId)),
  get: (dayId: string): Promise<Omit<Day, "dayNumber">> =>
    resolve(() => {
      const day = store.getDay(dayId);
      if (!day) throw new Error("Day not found");
      return day;
    }),
};

// ─── Events ─────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (dayId: string): Promise<TripEvent[]> =>
    resolve(() => store.listEvents(dayId) as TripEvent[]),
  create: (dayId: string, data: Partial<TripEvent>): Promise<TripEvent> =>
    resolve(() => store.createEvent(dayId, data) as TripEvent),
  update: (eventId: string, data: Partial<TripEvent>): Promise<TripEvent> =>
    resolve(() => store.updateEvent(eventId, data) as TripEvent),
  delete: (eventId: string): Promise<void> =>
    resolve(() => store.deleteEvent(eventId)),
};

// ─── Places ─────────────────────────────────────────────────────────────────

export const placesApi = {
  list: (tripId: string, query?: string): Promise<Place[]> =>
    resolve(() => store.listPlaces(tripId, query)),
  create: (tripId: string, data: Partial<Place>): Promise<Place> =>
    resolve(() => store.createPlace(tripId, data)),
  update: (placeId: string, data: Partial<Place>): Promise<Place> =>
    resolve(() => store.updatePlace(placeId, data)),
};

// ─── Bookings ───────────────────────────────────────────────────────────────

export const bookingsApi = {
  list: (tripId: string): Promise<Booking[]> =>
    resolve(() => store.listBookings(tripId)),
  create: (tripId: string, data: Partial<Booking>): Promise<Booking> =>
    resolve(() => store.createBooking(tripId, data)),
  update: (bookingId: string, data: Partial<Booking>): Promise<Booking> =>
    resolve(() => store.updateBooking(bookingId, data)),
  delete: (bookingId: string): Promise<void> =>
    resolve(() => store.deleteBooking(bookingId)),
};

// ─── Suggestions ────────────────────────────────────────────────────────────

export const suggestionsApi = {
  list: (tripId: string, city?: string): Promise<Suggestion[]> =>
    resolve(() => store.listSuggestions(tripId, city)),
};
