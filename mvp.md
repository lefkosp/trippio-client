Japan Itinerary App — MVP Spec (React Vite PWA + Express + Mongo)
1) Core goals (what “done” means)

One place to see where you are today, what’s next, and how to get there.

Every stop has address + phone + links + transit notes (train/uber).

Works well on phone as a PWA, with offline read for the itinerary + saved places.

Can be shared with someone else (view-only or editor).

2) MVP user flows
A) Create + share a trip

Create “Japan 2026” trip (dates + timezone).

Add collaborator by share link:

View-only link (no login needed)

Editor link (requires login OR “magic link” token) — pick whichever is easiest for your auth setup.

B) Day plan usage (daily)

Open “Today” screen:

shows current city, today’s date, next event card (big).

Tap into “Day view”:

timeline list of events (morning/afternoon/evening or time-based)

Tap an event:

address, phone, notes

“Open in Maps”

“Transit” section (train lines, station names, platform hints, taxi/uber note)

C) Add/edit quickly on mobile

Add event in under 15 seconds:

title + time(optional) + place + transit note

Add place details once, reuse across events.

D) Suggestions (lightweight MVP)

A “Suggestions” tab per city/day:

curated list (seeded by you / imported JSON)

one-tap “Add to day”

(No heavy AI planning required in MVP — just structured suggestions you can expand later.)

3) Screens (minimum set)

Trip Switcher

list trips, open trip

Today

next event + “navigate” actions

quick buttons: Day View / Map / Bookings

Itinerary

Day list (Day 1…Day 12) with city label

open a day

Day Detail

timeline of events

add/edit/reorder events (drag optional; buttons ok for MVP)

Event Detail (Drawer / Page)

full info + actions

Places

saved places list + search

Map

pins for today or selected day

Bookings / Important Info

flights, hotels, confirmation numbers, emergency contacts

That’s it. No analytics, no fancy customization yet.

4) Data model (Mongo collections)
Trip

_id

name

startDate, endDate

timezone (e.g., Asia/Tokyo)

createdBy

collaborators: [{ userId, role: "owner"|"editor"|"viewer" }]

shareLinks: [{ tokenHash, role, expiresAt?, createdAt }]

Day

_id

tripId

date (ISO date)

city (Tokyo/Kyoto/Osaka)

notes (optional)

Place

_id

tripId

name

address

phone (optional)

lat, lng (optional but recommended)

googleMapsUrl (optional)

tags: [] (food, shrine, museum)

notes

Event

_id

tripId

dayId

title

startTime / endTime (optional)

type (sight/food/transport/hotel/free)

placeId (optional)

transit

mode (train/uber/walk/other)

from / to (optional strings)

instructions (free text: lines, stations, etc.)

links: [] (e.g., Navitime route link)

links: [] (tickets, website, notes)

order (number for sorting)

status (planned/done/skipped)

Suggestion

_id

tripId

city

title

placeId?

type

why (short reason)

links: []

(Seed suggestions for Tokyo/Kyoto/Osaka; later you can generate these via an LLM.)

5) API endpoints (Express)
Auth (choose minimal)

If you already have auth in Decision Ledger, reuse it.

Sharing can be token-based so viewers don’t need accounts.

Trips

POST /trips create

GET /trips list my trips

GET /trips/:tripId get trip

Sharing

POST /trips/:tripId/share-links create link { role: viewer|editor, expiresAt? }

GET /share/:token resolve token → trip access (server sets session or returns short-lived JWT)

(MVP) Viewer token can directly authorize read-only API calls.

Days & itinerary

GET /trips/:tripId/days

POST /trips/:tripId/days (optional if auto-generated from date range)

GET /days/:dayId/events

POST /days/:dayId/events

PATCH /events/:eventId

DELETE /events/:eventId

PATCH /days/:dayId/events/reorder (optional; otherwise update order per edit)

Places

GET /trips/:tripId/places?query=

POST /trips/:tripId/places

PATCH /places/:placeId

Suggestions

GET /trips/:tripId/suggestions?city=Tokyo

POST /days/:dayId/events/from-suggestion/:suggestionId (or do client-side)

Bookings

GET /trips/:tripId/bookings

POST /trips/:tripId/bookings

PATCH /bookings/:id

DELETE /bookings/:id

6) PWA / Offline (MVP scope)

Offline read for:

days list

day events

places

bookings

Strategy:

Cache last-opened trip payload in IndexedDB (or localforage)

On app load: show cached data instantly → then sync when online

Don’t overcomplicate background sync in MVP.

7) Permissions (MVP rules)

Owner/Editor: CRUD itinerary, places, bookings, suggestions.

Viewer: read-only.

Sharing token maps to a role; API checks role on each request.

8) Non-goals (explicitly out of MVP)

Multi-trip templating

Automatic train schedule fetching

Real-time collaboration / conflict resolution

Full AI itinerary generation from scratch

Expenses/budgeting

9) “MVP Complete” checklist

 Create trip (12 days) + auto-generate days

 Day timeline works + add/edit events

 Places saved + selectable on event

 Transit notes per event + “Open in Maps”

 Bookings vault

 Share link (viewer at minimum)

 Offline read for itinerary + places + bookings