import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi, placesApi, bookingsApi } from "@/shared/api/client";
import type { TripEvent, Place, Booking } from "@/shared/types";

// ─── Events ─────────────────────────────────────────────────────────────────

export function useCreateEvent(dayId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TripEvent>) => eventsApi.create(dayId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", dayId] });
    },
  });
}

export function useUpdateEvent(dayId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Partial<TripEvent> }) =>
      eventsApi.update(eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", dayId] });
    },
  });
}

export function useDeleteEvent(dayId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.delete(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", dayId] });
    },
  });
}

// ─── Places ─────────────────────────────────────────────────────────────────

export function useCreatePlace(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Place>) => placesApi.create(tripId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["places", tripId] });
    },
  });
}

export function useUpdatePlace(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, data }: { placeId: string; data: Partial<Place> }) =>
      placesApi.update(placeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["places", tripId] });
    },
  });
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export function useCreateBooking(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Booking>) => bookingsApi.create(tripId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", tripId] });
    },
  });
}

export function useUpdateBooking(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: Partial<Booking> }) =>
      bookingsApi.update(bookingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", tripId] });
    },
  });
}

export function useDeleteBooking(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.delete(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", tripId] });
    },
  });
}
