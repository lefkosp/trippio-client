// ─── Trip ────────────────────────────────────────────────────────────────────

export interface Collaborator {
  userId: string;
  role: "owner" | "editor" | "viewer";
}

export interface ShareLink {
  tokenHash: string;
  role: "editor" | "viewer";
  expiresAt?: string;
  createdAt: string;
}

export interface Trip {
  _id: string;
  name: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  timezone: string;  // e.g. "Asia/Tokyo"
  createdBy: string;
  collaborators: Collaborator[];
  shareLinks: ShareLink[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Day ─────────────────────────────────────────────────────────────────────

export interface Day {
  _id: string;
  tripId: string;
  date: string;       // ISO date (YYYY-MM-DD)
  city: string;       // e.g. "Tokyo", "Kyoto", "Osaka"
  dayNumber: number;  // computed client-side from sorted position (1-indexed)
  order?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Place ───────────────────────────────────────────────────────────────────

export interface Place {
  _id: string;
  tripId: string;
  name: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  tags?: string[];   // e.g. ["food", "shrine", "museum"]
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Event ───────────────────────────────────────────────────────────────────

export type EventType = "sight" | "food" | "transport" | "hotel" | "free";
export type EventStatus = "planned" | "done" | "skipped";
export type TransitMode = "train" | "uber" | "walk" | "bus" | "other";

export interface TransitInfo {
  mode?: TransitMode;
  from?: string;
  to?: string;
  instructions?: string; // free text: lines, stations, platform hints
  links?: string[];      // e.g. Navitime route link
}

export interface TripEvent {
  _id: string;
  tripId: string;
  dayId: string;
  title: string;
  startTime?: string;  // "HH:mm"
  endTime?: string;
  type: EventType;
  placeId?: string;
  place?: Place;       // populated client-side via join
  transit?: TransitInfo;
  links?: string[];
  order: number;
  status: EventStatus;
  notes?: string;      // kept optional for resilience
  createdAt?: string;
  updatedAt?: string;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingType = "flight" | "hotel" | "reservation" | "rail" | "activity" | "other";

export interface Booking {
  _id: string;
  tripId: string;
  type: BookingType;
  title: string;
  confirmationNumber?: string;
  date?: string;           // YYYY-MM-DD
  startTime?: string;      // HH:mm
  location?: string;
  links?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Suggestion ──────────────────────────────────────────────────────────────

export interface Suggestion {
  _id: string;
  tripId: string;
  city: string;
  title: string;
  placeId?: string;
  type?: string;
  why?: string;
  links?: string[];
  createdAt?: string;
  updatedAt?: string;
}
