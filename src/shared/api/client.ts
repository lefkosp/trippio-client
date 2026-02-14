/**
 * API client — HTTP calls to Express backend.
 * Uses credentials: include for refresh cookies; optional Bearer token for auth.
 */

import type { Trip, Day, TripEvent, Place, Booking, Suggestion } from "@/shared/types";

// ─── Configuration ──────────────────────────────────────────────────────────

const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const API_BASE_URL = base.includes("/api") ? base : `${base}/api`;

/** Set by AuthProvider so authenticated requests include Bearer token. */
let accessToken: string | null = null;
let shareAccessToken: string | null = null;
export function setApiAccessToken(token: string | null) {
  accessToken = token;
}
export function setApiShareAccessToken(token: string | null) {
  shareAccessToken = token;
}

// ─── Helper functions ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T;
  error: null | { message: string; code?: string };
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  const token = accessToken || shareAccessToken;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: { message: `HTTP ${response.status}: ${response.statusText}` },
    }));
    throw new Error(errorData.error?.message || `Request failed: ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

// ─── Trips ──────────────────────────────────────────────────────────────────

export const tripsApi = {
  list: (): Promise<Trip[]> => request<Trip[]>("/trips"),
  get: (tripId: string): Promise<Trip> => request<Trip>(`/trips/${tripId}`),
  create: (data: Partial<Trip>): Promise<Trip> =>
    request<Trip>("/trips", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createShareLink: (
    tripId: string,
    expiresInDays?: number
  ): Promise<{ url: string }> =>
    request<{ url: string }>(`/trips/${tripId}/share-links`, {
      method: "POST",
      body: JSON.stringify(
        expiresInDays ? { expiresInDays } : {}
      ),
    }),
};

// ─── Days ───────────────────────────────────────────────────────────────────

export const daysApi = {
  list: (tripId: string): Promise<Omit<Day, "dayNumber">[]> =>
    request<Omit<Day, "dayNumber">[]>(`/trips/${tripId}/days`),
  get: (dayId: string): Promise<Omit<Day, "dayNumber">> =>
    request<Omit<Day, "dayNumber">>(`/days/${dayId}`),
};

// ─── Events ─────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (dayId: string): Promise<TripEvent[]> =>
    request<TripEvent[]>(`/days/${dayId}/events`),
  create: (dayId: string, data: Partial<TripEvent>): Promise<TripEvent> =>
    request<TripEvent>(`/days/${dayId}/events`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (eventId: string, data: Partial<TripEvent>): Promise<TripEvent> =>
    request<TripEvent>(`/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (eventId: string): Promise<void> =>
    request<void>(`/events/${eventId}`, {
      method: "DELETE",
    }),
};

// ─── Places ─────────────────────────────────────────────────────────────────

export const placesApi = {
  list: (tripId: string, query?: string): Promise<Place[]> => {
    const params = query ? `?query=${encodeURIComponent(query)}` : "";
    return request<Place[]>(`/trips/${tripId}/places${params}`);
  },
  create: (tripId: string, data: Partial<Place>): Promise<Place> =>
    request<Place>(`/trips/${tripId}/places`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (placeId: string, data: Partial<Place>): Promise<Place> =>
    request<Place>(`/places/${placeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─── Bookings ───────────────────────────────────────────────────────────────

export const bookingsApi = {
  list: (tripId: string): Promise<Booking[]> =>
    request<Booking[]>(`/trips/${tripId}/bookings`),
  create: (tripId: string, data: Partial<Booking>): Promise<Booking> =>
    request<Booking>(`/trips/${tripId}/bookings`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (bookingId: string, data: Partial<Booking>): Promise<Booking> =>
    request<Booking>(`/bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (bookingId: string): Promise<void> =>
    request<void>(`/bookings/${bookingId}`, {
      method: "DELETE",
    }),
};

// ─── Suggestions ────────────────────────────────────────────────────────────

export const suggestionsApi = {
  list: (tripId: string, city?: string): Promise<Suggestion[]> => {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    return request<Suggestion[]>(`/trips/${tripId}/suggestions${params}`);
  },
};

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

export interface RequestLinkResponse {
  ok: boolean;
  magicLink?: string; // dev only
}

export interface VerifyResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  user?: AuthUser;
}

export interface ResolveShareResponse {
  shareAccessToken: string;
  tripId: string;
  role: "viewer";
}

export const authApi = {
  requestLink: (email: string): Promise<RequestLinkResponse> =>
    request<RequestLinkResponse>("/auth/request-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verify: (token: string): Promise<VerifyResponse> =>
    request<VerifyResponse>(`/auth/verify?token=${encodeURIComponent(token)}`),
  refresh: (): Promise<RefreshResponse> =>
    request<RefreshResponse>("/auth/refresh", { method: "POST" }),
  logout: (): Promise<{ ok: boolean }> =>
    request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
};

export const shareApi = {
  resolve: (token: string): Promise<ResolveShareResponse> =>
    request<ResolveShareResponse>(`/share/${encodeURIComponent(token)}`),
};
