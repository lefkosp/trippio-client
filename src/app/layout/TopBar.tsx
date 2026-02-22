import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Check,
  Copy,
  Link,
  LogOut,
  Plus,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTripContext } from "@/shared/context/useTripContext";
import { useTripSwitcher } from "@/shared/context/TripSwitcherContext";
import { useAuth } from "@/auth/useAuth";
import { tripsApi } from "@/shared/api/client";
import { useCreateTrip, useDeleteTrip } from "@/shared/hooks/mutations";
import { toast } from "sonner";

const DEFAULT_TIMEZONE =
  typeof Intl !== "undefined" && Intl.DateTimeFormat?.().resolvedOptions?.().timeZone
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "Asia/Tokyo";

export function TopBar() {
  const navigate = useNavigate();
  const { trip } = useTripContext();
  const { trips, setSelectedTripId } = useTripSwitcher();
  const { logout, user, isReadOnly } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isLoadingShareLink, setIsLoadingShareLink] = useState(false);
  const [shareRole, setShareRole] = useState<"viewer" | "editor">("viewer");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createTimezone, setCreateTimezone] = useState(DEFAULT_TIMEZONE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();

  const canShowActions = !isReadOnly && !!user;
  const isOwner = !!user && !!trip && String(trip.createdBy) === String(user.id);
  const showDeleteTrip = canShowActions && !!trip && isOwner;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function openShareSheet() {
    setShareOpen(true);
    setShareUrl("");
    setCopied(false);
    setShareRole("viewer");
  }

  async function createShareLink(role: "viewer" | "editor") {
    setShareRole(role);
    setIsLoadingShareLink(true);
    try {
      const { url } = await tripsApi.createShareLink(trip._id, role);
      setShareUrl(url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create share link",
      );
    } finally {
      setIsLoadingShareLink(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: `Check out my trip plan: ${trip.name}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled — ignore
      }
    }
  }

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    const start = createStartDate || new Date().toISOString().slice(0, 10);
    const end = createEndDate || start;
    try {
      const newTrip = await createTrip.mutateAsync({
        name: createName.trim(),
        startDate: start,
        endDate: end,
        timezone: createTimezone || DEFAULT_TIMEZONE,
      });
      toast.success("Trip created");
      setSelectedTripId(newTrip._id);
      setCreateOpen(false);
      setCreateName("");
      setCreateStartDate("");
      setCreateEndDate("");
      setCreateTimezone(DEFAULT_TIMEZONE);
      setSwitcherOpen(false);
      navigate("/today");
    } catch {
      toast.error("Could not create trip");
    }
  }

  function openDeleteDialog() {
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!trip) return;
    try {
      await deleteTrip.mutateAsync(trip._id);
      toast.success("Trip deleted");
      setDeleteDialogOpen(false);
      setSwitcherOpen(false);
      const remaining = trips.filter((t) => t._id !== trip._id);
      if (remaining.length > 0) {
        setSelectedTripId(remaining[0]._id);
      } else {
        setSelectedTripId("");
      }
      navigate("/today");
    } catch {
      toast.error("Could not delete trip");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          {/* Left: Wordmark + trip selector */}
          <div className="flex items-center gap-3">
            <span className="trippio-wordmark text-sm">Trippio</span>
            <div className="h-4 w-px bg-border" />
            <button
              type="button"
              onClick={() => !isReadOnly && setSwitcherOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors press-scale min-w-0 max-w-[180px]"
            >
              <span className="truncate">{trip.name}</span>
              {!isReadOnly && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
            </button>
            {isReadOnly && (
              <span className="badge-subtle bg-elev-2 text-muted-foreground">
                View only (shared)
              </span>
            )}
          </div>

          {/* Right: Share + Logout */}
          <div className="flex items-center gap-1">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={openShareSheet}
                  title="Share trip"
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Trip switcher Sheet */}
      <Sheet open={switcherOpen && !isReadOnly} onOpenChange={setSwitcherOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[50dvh] rounded-t-2xl bg-elev-1 border-t border-border"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-lg tracking-tight">
              Switch trip
            </SheetTitle>
          </SheetHeader>
          <div className="pt-2 px-4 pb-6">
            <ul className="space-y-1">
              {trips.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTripId(t._id);
                      setSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      t._id === trip._id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-elev-2"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {t._id === trip._id && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {canShowActions && (
              <>
                <Separator className="my-3" />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setCreateOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-elev-2 transition-colors"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Create trip
                  </button>
                  {showDeleteTrip && (
                    <button
                      type="button"
                      onClick={() => {
                        setSwitcherOpen(false);
                        openDeleteDialog();
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-destructive hover:bg-elev-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      Delete trip
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create trip dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Create trip</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTrip} className="space-y-4 pt-2">
            <Input
              placeholder="Trip name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                placeholder="Start date"
                value={createStartDate}
                onChange={(e) => setCreateStartDate(e.target.value)}
                required
              />
              <Input
                type="date"
                placeholder="End date"
                value={createEndDate}
                onChange={(e) => setCreateEndDate(e.target.value)}
                required
              />
            </div>
            <Input
              placeholder="Timezone (optional)"
              value={createTimezone}
              onChange={(e) => setCreateTimezone(e.target.value)}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={createTrip.isPending}
            >
              {createTrip.isPending ? "Creating…" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete trip confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the trip and all related data (days,
              events, places, bookings, proposals, share links, collaborators).
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleConfirmDelete();
              }}
              disabled={deleteTrip.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTrip.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Sheet */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[50dvh] rounded-t-2xl bg-elev-1 border-t border-border"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-lg tracking-tight">
              Share Trip
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pt-2 px-4 pb-6">
            <p className="text-sm text-muted-foreground">
              Share a link to <strong>{trip.name}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={shareRole === "viewer" ? "default" : "outline"}
                onClick={() => createShareLink("viewer")}
                disabled={isLoadingShareLink}
              >
                Share view-only link
              </Button>
              <Button
                variant={shareRole === "editor" ? "default" : "outline"}
                onClick={() => createShareLink("editor")}
                disabled={isLoadingShareLink}
              >
                Share editor link
              </Button>
            </div>

            {/* Link display */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-elev-2 border border-border">
              <Link className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {isLoadingShareLink
                  ? `Creating ${shareRole === "editor" ? "editor" : "view-only"} link...`
                  : shareUrl || "Choose a share type to generate a link"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopy}
                disabled={!shareUrl || isLoadingShareLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy Link
                  </>
                )}
              </Button>
              {typeof navigator.share === "function" && (
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleNativeShare}
                  disabled={!shareUrl || isLoadingShareLink}
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
