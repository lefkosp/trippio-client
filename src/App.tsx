import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClientRestore, persistQueryClientSave } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppShell } from "@/app/layout/AppShell";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { VerifyScreen } from "@/features/auth/VerifyScreen";
import { DemoOpenScreen } from "@/features/auth/DemoOpenScreen";
import { TodayScreen } from "@/features/today/TodayScreen";
import { ItineraryScreen } from "@/features/itinerary/ItineraryScreen";
import { DayDetailScreen } from "@/features/itinerary/DayDetailScreen";
import { MapScreen } from "@/features/map/MapScreen";
import { BookingsScreen } from "@/features/bookings/BookingsScreen";
import { PlacesScreen } from "@/features/places/PlacesScreen";
import { ShareOpenScreen } from "@/features/share/ShareOpenScreen";
import { ProposalsScreen } from "@/features/proposals/ProposalsScreen";
import { AccessScreen } from "@/features/share/AccessScreen";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Not THIRTY_DAYS_MS: React Query passes gcTime straight to
      // setTimeout, whose delay is a 32-bit signed int (max ~24.8 days) —
      // 30 days overflows it, and the browser fires the "timer" almost
      // immediately instead of in 30 days, silently GC'ing every
      // unobserved cached query within about a second of creation
      // (reproduced live: a query set via setQueryData with no mounted
      // useQuery observer vanished from the cache in under 2s). Infinity
      // is treated as "never garbage-collect" by React Query, which is
      // what "survives offline for a while" actually requires anyway.
      gcTime: Infinity,
      retry: 1,
    },
  },
});

// IndexedDB-backed persister so the trip (days/events/places/bookings/proposals)
// survives a full reload with no network — the offline-auth path only helps if
// there's cached data to render once the user is let past the auth gate.
// (localStorage would also work but has a ~5MB ceiling shared with everything
// else on the origin; IndexedDB doesn't.)
const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
});

// Deliberately NOT using PersistQueryClientProvider's default behavior, which
// writes the whole cache to storage on every query state change. Multiple
// tabs (or even one tab's first paint, before a query has finished fetching)
// can each write their own snapshot; whichever happens to write last wins,
// and a transient/empty state can silently overwrite good cached data for
// every future tab on this origin — reproduced during testing. Saving only
// on visibilitychange/pagehide means we only ever persist a settled state,
// at the moment the user actually stops looking at the tab.
function usePersistQueryClientOnHide() {
  useEffect(() => {
    let cancelled = false;

    persistQueryClientRestore({
      queryClient,
      persister: idbPersister,
      maxAge: THIRTY_DAYS_MS,
    });

    const save = () => {
      if (cancelled) return;
      persistQueryClientSave({ queryClient, persister: idbPersister });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") save();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", save);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", save);
    };
  }, []);
}

function App() {
  usePersistQueryClientOnHide();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/auth/verify" element={<VerifyScreen />} />
            <Route path="/share/:token" element={<ShareOpenScreen />} />
            <Route path="/demo" element={<DemoOpenScreen />} />
            <Route element={<AppShell />}>
              <Route path="/today" element={<TodayScreen />} />
              <Route path="/itinerary" element={<ItineraryScreen />} />
              <Route path="/itinerary/:dayId" element={<DayDetailScreen />} />
              <Route path="/map" element={<MapScreen />} />
              <Route path="/bookings" element={<BookingsScreen />} />
              <Route path="/places" element={<PlacesScreen />} />
              <Route path="/proposals" element={<ProposalsScreen />} />
              {/* The "More" tab is gone — Places, Bookings and Sharing moved
                  into the trip sheet. Kept as a redirect so an old bookmark or
                  an installed PWA shortcut doesn't dead-end. */}
              <Route path="/more" element={<Navigate to="/today" replace />} />
              <Route path="/access" element={<AccessScreen />} />
              <Route path="/" element={<Navigate to="/today" replace />} />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
