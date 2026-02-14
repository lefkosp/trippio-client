import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/shared/hooks/queries";
import { TripProvider } from "@/shared/context/TripContext";

export function AppShell() {
  const { data: trips, isLoading, error } = useTrips();
  const activeTrip = trips?.[0];

  // Loading state while trips are fetched
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <span className="trippio-wordmark text-lg block">Trippio</span>
          <Skeleton className="h-2 w-32 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  // Error / no trips state
  if (error || !activeTrip) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <span className="trippio-wordmark text-lg block mb-4">Trippio</span>
          <p className="text-sm text-muted-foreground">
            {error
              ? "Could not connect to the server. Make sure the backend is running on port 4000."
              : "No trips found. Seed the database with `npm run seed`."}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {error instanceof Error ? error.message : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TripProvider trip={activeTrip}>
      <div className="min-h-dvh bg-background">
        <TopBar />
        <main className="max-w-md mx-auto px-4 pb-28 pt-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </TripProvider>
  );
}
