import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTripWizard } from "./CreateTripWizard";
import { useAuth } from "@/auth/useAuth";
import { useTrip, useTrips } from "@/shared/hooks/queries";
import { TripProvider } from "@/shared/context/TripContext";
import { TripSwitcherProvider } from "@/shared/context/TripSwitcherContext";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export function AppShell() {
  const navigate = useNavigate();
  const { user, share, isReadOnly, isLoading: authLoading } = useAuth();
  const isShareOnly = !user && !!share;
  const { data: trips, isLoading: tripsLoading, error: tripsError } = useTrips(!isShareOnly);
  const { data: sharedTrip, isLoading: sharedTripLoading, error: sharedTripError } = useTrip(
    share?.tripId ?? ""
  );
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !share) {
      navigate("/login", { replace: true });
      return;
    }
  }, [user, share, authLoading, navigate]);

  useEffect(() => {
    if (isShareOnly && share?.tripId) {
      setSelectedTripId(share.tripId);
    }
  }, [isShareOnly, share?.tripId]);

  const isLoading =
    authLoading ||
    (!useMocks && (isShareOnly ? sharedTripLoading : tripsLoading));
  const tripList = isShareOnly ? (sharedTrip ? [sharedTrip] : []) : (trips ?? []);
  const activeTrip = isShareOnly
    ? (sharedTrip ?? null)
    : (tripList.find((t) => t._id === selectedTripId) ?? tripList[0] ?? null);
  const error = isShareOnly ? sharedTripError : tripsError;

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <span className="trippio-wordmark text-lg block">Trippio</span>
          <Skeleton className="h-2 w-32 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  if (!user && !share) {
    return null;
  }

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
        <div className="text-center space-y-4 max-w-xs">
          <span className="trippio-wordmark text-lg block mb-4">Trippio</span>
          <p className="text-sm text-muted-foreground">
            {error
              ? "Could not open this trip. Make sure the backend is running on port 4000 and the link is valid."
              : isReadOnly
                ? "This shared trip is not available."
                : "No trips found. Create one or seed the database with `npm run seed`."}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {error instanceof Error ? error.message : ""}
          </p>
          {!useMocks && !isReadOnly && (
            <>
              <Button onClick={() => setWizardOpen(true)}>Create trip</Button>
              <CreateTripWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                onSuccess={(newTrip) => {
                  setSelectedTripId(newTrip._id);
                  navigate("/today");
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <TripSwitcherProvider
      trips={tripList}
      selectedTripId={selectedTripId}
      setSelectedTripId={setSelectedTripId}
    >
      <TripProvider trip={activeTrip}>
        <div className="min-h-dvh bg-background">
          <TopBar />
          <main className="max-w-md mx-auto px-4 pb-28 pt-6">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </TripProvider>
    </TripSwitcherProvider>
  );
}
