import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppShell } from "@/app/layout/AppShell";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { VerifyScreen } from "@/features/auth/VerifyScreen";
import { TodayScreen } from "@/features/today/TodayScreen";
import { ItineraryScreen } from "@/features/itinerary/ItineraryScreen";
import { DayDetailScreen } from "@/features/itinerary/DayDetailScreen";
import { MapScreen } from "@/features/map/MapScreen";
import { BookingsScreen } from "@/features/bookings/BookingsScreen";
import { PlacesScreen } from "@/features/places/PlacesScreen";
import { ShareOpenScreen } from "@/features/share/ShareOpenScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/auth/verify" element={<VerifyScreen />} />
            <Route path="/share/:token" element={<ShareOpenScreen />} />
            <Route element={<AppShell />}>
              <Route path="/today" element={<TodayScreen />} />
              <Route path="/itinerary" element={<ItineraryScreen />} />
              <Route path="/itinerary/:dayId" element={<DayDetailScreen />} />
              <Route path="/map" element={<MapScreen />} />
              <Route path="/bookings" element={<BookingsScreen />} />
              <Route path="/places" element={<PlacesScreen />} />
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
