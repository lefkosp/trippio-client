import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, eventsApi, placesApi, bookingsApi, proposalsApi } from "@/shared/api/client";
import type { Trip, TripEvent, Place, Booking } from "@/shared/types";
import type { CreateProposalPayload, ConvertProposalPayload } from "@/shared/api/client";

// ─── Trips ───────────────────────────────────────────────────────────────────

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Trip>) => tripsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateCollaboratorRole(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "editor" | "viewer" }) =>
      tripsApi.updateCollaboratorRole(tripId, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators", tripId] }),
  });
}

export function useRemoveCollaborator(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => tripsApi.removeCollaborator(tripId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators", tripId] }),
  });
}

export function useRevokeShareLink(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shareLinkId: string) => tripsApi.revokeShareLink(tripId, shareLinkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["share-links", tripId] }),
  });
}

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

// ─── Proposals ───────────────────────────────────────────────────────────────

export function useCreateProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProposalPayload) => proposalsApi.create(tripId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", tripId] }),
  });
}

export function useVoteProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, value }: { proposalId: string; value: "yes" | "no" }) =>
      proposalsApi.vote(proposalId, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", tripId] }),
  });
}

export function useApproveProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => proposalsApi.approve(proposalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", tripId] }),
  });
}

export function useRejectProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => proposalsApi.reject(proposalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", tripId] }),
  });
}

export function useConvertProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: string; payload: ConvertProposalPayload }) =>
      proposalsApi.convert(proposalId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["proposals", tripId] });
      if (_data?.event?.dayId) {
        qc.invalidateQueries({ queryKey: ["events", _data.event.dayId] });
      }
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
