import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/auth/useAuth";
import { useTrip, useTrips } from "@/shared/hooks/queries";
import { useCreateTrip } from "@/shared/hooks/mutations";
import { TripProvider } from "@/shared/context/TripContext";
import { TripSwitcherProvider } from "@/shared/context/TripSwitcherContext";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const createTrip = useCreateTrip();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const start = startDate || new Date().toISOString().slice(0, 10);
    const end = endDate || start;
    try {
      await createTrip.mutateAsync({
        name: name.trim(),
        startDate: start,
        endDate: end,
        timezone: "UTC",
      });
      setOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
    } catch {
      // Error surfaced by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create trip</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            placeholder="Trip name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              placeholder="Start"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="End"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={createTrip.isPending}>
            {createTrip.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const { user, share, isReadOnly, isLoading: authLoading } = useAuth();
  const isShareOnly = !user && !!share;
  const { data: trips, isLoading: tripsLoading, error: tripsError } = useTrips(!isShareOnly);
  const { data: sharedTrip, isLoading: sharedTripLoading, error: sharedTripError } = useTrip(
    share?.tripId ?? ""
  );
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

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
            <CreateTripDialog />
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
