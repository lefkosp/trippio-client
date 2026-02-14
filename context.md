Design approach for Cursor skeleton (mobile-first)

Principles

Bottom navigation (Today / Itinerary / Map / Bookings / Places)

One-handed actions: primary CTA near bottom (e.g., “+ Add event”)

Event detail as a Sheet (slides up) not a new page, for fast in/out

Big “Next up” card on Today

Use type + status chips to scan quickly (food/sight/transport, planned/done)

Layout

Max width container for desktop, but always optimized for phone:

max-w-md mx-auto feel on desktop

Sticky top bar with Trip selector + share icon

Tooling choices (keep it minimal)

Frontend:

Vite + React + TS

Tailwind + shadcn/ui

TanStack Query (you already use it at work; perfect for caching + offline-ish patterns)

Zustand or Valtio (pick one) for tiny UI state (selected day, open sheet). If unsure: Zustand.

PWA:

vite-plugin-pwa for manifest + service worker

Backend:

Express + Mongo + simple RBAC middleware (viewer/editor)

Share tokens (hashed) → issue short-lived JWT for API calls

Maps:

MVP: start with “Open in Google Maps” links + a basic embedded map view later

If you want map view immediately: Leaflet is simplest. (But you can delay it.)

What to tell Cursor to generate (rough skeleton)

You want Cursor to scaffold:

App shell with bottom nav

Routes + placeholder screens

Component library setup (shadcn + tailwind)

API client + TanStack Query hooks (empty implementations)

Data types aligned with your mvp.md

Basic responsive UI and a Sheet for Event detail