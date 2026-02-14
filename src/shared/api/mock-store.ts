/**
 * Mock Data Store — localStorage-backed CRUD service.
 *
 * Seeds from mocks/data.ts on first load. All mutations persist to
 * localStorage so state survives page refreshes.
 *
 * When a real Express + Mongo backend is ready, swap the implementations
 * in client.ts back to HTTP fetch calls.
 */

import type { Trip, Day, TripEvent, Place, Booking, Suggestion } from "@/shared/types";
import {
  mockTrip,
  mockDays,
  mockEvents,
  mockPlaces,
  mockBookings,
  mockSuggestions,
} from "@/mocks/data";

// ─── Storage helpers ────────────────────────────────────────────────────────

const STORAGE_KEY = "trippio_mock_data";

interface StoreData {
  trips: Trip[];
  days: (Omit<Day, "dayNumber"> & { order?: number })[];
  events: Omit<TripEvent, "place">[];
  places: Place[];
  bookings: Booking[];
  suggestions: Suggestion[];
}

function stripPlaceFromEvents(events: TripEvent[]): Omit<TripEvent, "place">[] {
  return events.map(({ place: _place, ...rest }) => rest);
}

function loadOrSeed(): StoreData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      /* corrupted — re-seed */
    }
  }
  const seed: StoreData = {
    trips: [mockTrip],
    days: mockDays,
    events: stripPlaceFromEvents(mockEvents),
    places: mockPlaces,
    bookings: mockBookings,
    suggestions: mockSuggestions,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

let data = loadOrSeed();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Trips ──────────────────────────────────────────────────────────────────

export function listTrips(): Trip[] {
  return [...data.trips];
}

export function getTrip(tripId: string): Trip | undefined {
  return data.trips.find((t) => t._id === tripId);
}

// ─── Days ───────────────────────────────────────────────────────────────────

export function listDays(tripId: string) {
  return data.days
    .filter((d) => d.tripId === tripId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDay(dayId: string) {
  return data.days.find((d) => d._id === dayId);
}

// ─── Events ─────────────────────────────────────────────────────────────────

export function listEvents(dayId: string): Omit<TripEvent, "place">[] {
  return data.events
    .filter((e) => e.dayId === dayId)
    .sort((a, b) => a.order - b.order);
}

export function createEvent(
  dayId: string,
  input: Partial<TripEvent>
): Omit<TripEvent, "place"> {
  const day = data.days.find((d) => d._id === dayId);
  const existing = data.events.filter((e) => e.dayId === dayId);

  const event: Omit<TripEvent, "place"> = {
    _id: uid("evt"),
    tripId: day?.tripId ?? "",
    dayId,
    title: input.title ?? "Untitled",
    startTime: input.startTime,
    endTime: input.endTime,
    type: input.type ?? "free",
    placeId: input.placeId,
    transit: input.transit,
    links: input.links,
    order: input.order ?? existing.length + 1,
    status: input.status ?? "planned",
    notes: input.notes,
  };

  data.events.push(event);
  persist();
  return event;
}

export function updateEvent(
  eventId: string,
  patch: Partial<TripEvent>
): Omit<TripEvent, "place"> {
  const idx = data.events.findIndex((e) => e._id === eventId);
  if (idx === -1) throw new Error("Event not found");
  const { place: _place, ...safePatch } = patch as TripEvent;
  data.events[idx] = { ...data.events[idx], ...safePatch };
  persist();
  return data.events[idx];
}

export function deleteEvent(eventId: string) {
  data.events = data.events.filter((e) => e._id !== eventId);
  persist();
}

// ─── Places ─────────────────────────────────────────────────────────────────

export function listPlaces(tripId: string, query?: string): Place[] {
  let result = data.places.filter((p) => p.tripId === tripId);
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }
  return result;
}

export function createPlace(tripId: string, input: Partial<Place>): Place {
  const place: Place = {
    _id: uid("place"),
    tripId,
    name: input.name ?? "Unnamed Place",
    address: input.address ?? "",
    phone: input.phone,
    lat: input.lat,
    lng: input.lng,
    googleMapsUrl: input.googleMapsUrl,
    tags: input.tags,
    notes: input.notes,
  };
  data.places.push(place);
  persist();
  return place;
}

export function updatePlace(placeId: string, patch: Partial<Place>): Place {
  const idx = data.places.findIndex((p) => p._id === placeId);
  if (idx === -1) throw new Error("Place not found");
  data.places[idx] = { ...data.places[idx], ...patch };
  persist();
  return data.places[idx];
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export function listBookings(tripId: string): Booking[] {
  return data.bookings.filter((b) => b.tripId === tripId);
}

export function createBooking(tripId: string, input: Partial<Booking>): Booking {
  const booking: Booking = {
    _id: uid("bk"),
    tripId,
    type: input.type ?? "other",
    title: input.title ?? "Untitled",
    confirmationNumber: input.confirmationNumber,
    date: input.date,
    startTime: input.startTime,
    location: input.location,
    links: input.links,
    notes: input.notes,
  };
  data.bookings.push(booking);
  persist();
  return booking;
}

export function updateBooking(bookingId: string, patch: Partial<Booking>): Booking {
  const idx = data.bookings.findIndex((b) => b._id === bookingId);
  if (idx === -1) throw new Error("Booking not found");
  data.bookings[idx] = { ...data.bookings[idx], ...patch };
  persist();
  return data.bookings[idx];
}

export function deleteBooking(bookingId: string) {
  data.bookings = data.bookings.filter((b) => b._id !== bookingId);
  persist();
}

// ─── Suggestions ────────────────────────────────────────────────────────────

export function listSuggestions(tripId: string, city?: string): Suggestion[] {
  let result = data.suggestions.filter((s) => s.tripId === tripId);
  if (city) result = result.filter((s) => s.city === city);
  return result;
}
