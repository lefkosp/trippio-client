import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTripWizard } from "./CreateTripWizard";
import { useAuth } from "@/auth/useAuth";
import { useTrip, useTrips } from "@/shared/hooks/queries";
import { usePrefetchTripData } from "@/shared/hooks/usePrefetchTripData";
import { TripProvider } from "@/shared/context/TripContext";
import { TripSwitcherProvider } from "@/shared/context/TripSwitcherContext";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export function AppShell() {
  const navigate = useNavigate();
  const { user, share, isReadOnly, isLoading: authLoading, isOffline } = useAuth();
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

  usePrefetchTripData(activeTrip?._id, !isOffline);

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

  // Error / no trips state — checked on activeTrip alone, not `error`: React
  // Query keeps last-known-good data on a failed background refetch, so if we
  // have cached trip data (e.g. offline after a previous visit) activeTrip is
  // still set and we fall through to the main render below instead of here.
  if (!activeTrip) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-xs">
          <span className="trippio-wordmark text-lg block mb-4">Trippio</span>
          <p className="text-sm text-muted-foreground">
            {isOffline
              ? "You're offline and no trip is cached yet. Reconnect and try again."
              : error
                ? "Could not open this trip. Check your connection to the Trippio server and make sure the link is valid."
                : isReadOnly
                  ? "This shared trip is not available."
                  : "No trips yet. Start one and the days will follow."}
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
        {/* Phone-first, and on a desktop it says so rather than floating a
            448px column in a void. The app keeps its full height so every
            fixed-position child (nav, FAB, sheets) still anchors correctly;
            what changes is that the column now has visible edges and a
            distinct ground behind it. */}
        <div className="h-dvh bg-page flex flex-col overflow-hidden">
          <div className="h-full w-full max-w-md mx-auto flex flex-col bg-background md:border-x md:border-border">
            {isOffline && (
              <div className="shrink-0 bg-warning text-warning-foreground text-xs font-medium text-center py-1.5 px-4">
                Offline. Everything's here, but you can't change it until you're back.
              </div>
            )}
            <TopBar />
            <main className="flex-1 min-h-0 overflow-y-auto w-full px-4 pb-24">
              <Outlet />
            </main>
          </div>
          <BottomNav />
        </div>
      </TripProvider>
    </TripSwitcherProvider>
  );
}
