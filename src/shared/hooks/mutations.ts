import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, daysApi, eventsApi, placesApi, bookingsApi, proposalsApi, linkPreviewApi } from "@/shared/api/client";
import type { Trip, TripEvent, Place, Booking } from "@/shared/types";
import type {
  CreateTripPayload,
  CreateProposalPayload,
  ConvertProposalPayload,
  PromoteProposalPayload,
  LinkPreview,
  TripExport,
} from "@/shared/api/client";

// ─── Trips ───────────────────────────────────────────────────────────────────

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTripPayload) => tripsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useImportTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TripExport) => tripsApi.import(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => tripsApi.delete(tripId),
    onSuccess: (_data, tripId) => {
      qc.setQueryData<Trip[]>(["trips"], (old) =>
        old ? old.filter((t) => t._id !== tripId) : []
      );
      qc.removeQueries({ queryKey: ["trip", tripId] });
      qc.removeQueries({ queryKey: ["days", tripId] });
      qc.removeQueries({ queryKey: ["places", tripId] });
      qc.removeQueries({ queryKey: ["bookings", tripId] });
      qc.removeQueries({ queryKey: ["proposals", tripId] });
      qc.removeQueries({ queryKey: ["share-links", tripId] });
      qc.removeQueries({ queryKey: ["collaborators", tripId] });
    },
  });
}

export function useCreateShareLink(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, expiresInDays }: { role: "viewer" | "editor"; expiresInDays?: number }) =>
      tripsApi.createShareLink(tripId, role, expiresInDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["share-links", tripId] }),
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

// ─── Days ───────────────────────────────────────────────────────────────────

export function useGenerateDays(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => daysApi.generate(tripId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["days", tripId] }),
  });
}

export function useUpdateDay(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: { city?: string; notes?: string } }) =>
      daysApi.update(dayId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["days", tripId] }),
  });
}

// ─── Events ─────────────────────────────────────────────────────────────────

export function useCreateEvent(dayId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TripEvent>) => eventsApi.create(dayId, data),
    onSuccess: () => {
      // Broad match ("events") also covers the trip-wide ["events","trip",tripId]
      // cache — assigning a place to a day changes what shows as unassigned.
      qc.invalidateQueries({ queryKey: ["events"] });
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

// Suggestion only — nothing is persisted, the result just populates local form
// state, so there's no cache to invalidate.
export function useEnrichPlace(tripId: string) {
  return useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      placesApi.enrich(tripId, data),
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
    mutationFn: ({ proposalId, value }: { proposalId: string; value: "yes" | "maybe" | "no" }) =>
      proposalsApi.vote(proposalId, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", tripId] }),
  });
}

export function useApproveProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => proposalsApi.approve(proposalId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["proposals", tripId] });
      if (data?.event?.dayId) {
        qc.invalidateQueries({ queryKey: ["events", data.event.dayId] });
      }
    },
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
    onSuccess: (_data) => {
      qc.invalidateQueries({ queryKey: ["proposals", tripId] });
      if (_data?.event?.dayId) {
        qc.invalidateQueries({ queryKey: ["events", _data.event.dayId] });
      }
    },
  });
}

export function useSuggestProposalSlot() {
  return useMutation({
    mutationFn: (proposalId: string) => proposalsApi.suggestSlot(proposalId),
  });
}

export function usePromoteProposal(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: string; payload: PromoteProposalPayload }) =>
      proposalsApi.promote(proposalId, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["proposals", tripId] });
      qc.invalidateQueries({ queryKey: ["places", tripId] });
      if (data?.event?.dayId) {
        qc.invalidateQueries({ queryKey: ["events", data.event.dayId] });
      }
    },
  });
}

// Not tied to a trip's query cache — a preview is a one-off lookup used while
// composing a proposal, not itself cached app state.
export function useLinkPreview() {
  return useMutation({
    mutationFn: (url: string) => linkPreviewApi.fetch(url),
  });
}

export function useSetProposalPreview(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, preview }: { proposalId: string; preview: LinkPreview }) =>
      proposalsApi.setPreview(proposalId, preview),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals", tripId] }),
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
