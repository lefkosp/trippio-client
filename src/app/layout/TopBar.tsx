import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Copy,
  Download,
  Link,
  LogOut,
  MapPin,
  Plus,
  Share2,
  Ticket,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { CreateTripWizard } from "./CreateTripWizard";
import { TripCover } from "./TripCover";
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
import { useDays } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import { useTripSwitcher } from "@/shared/context/TripSwitcherContext";
import { useAuth } from "@/auth/useAuth";
import { tripsApi } from "@/shared/api/client";
import { useDeleteTrip, useImportTrip } from "@/shared/hooks/mutations";
import { toast } from "sonner";

const tripSections = [
  { path: "/places", label: "Places", icon: MapPin },
  { path: "/bookings", label: "Bookings", icon: Ticket },
  { path: "/access", label: "Sharing & access", icon: Share2 },
] as const;

export function TopBar() {
  const navigate = useNavigate();
  const { trip } = useTripContext();
  const { trips, setSelectedTripId } = useTripSwitcher();
  const { logout, user, isReadOnly } = useAuth();
  const { data: days } = useDays(trip._id);
  const [shareOpen, setShareOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isLoadingShareLink, setIsLoadingShareLink] = useState(false);
  const [shareRole, setShareRole] = useState<"viewer" | "editor" | null>(null);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const deleteTrip = useDeleteTrip();
  const importTrip = useImportTrip();

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
    setShareRole(null);
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

  function handleCreateTripSuccess(newTrip: { _id: string }) {
    setSelectedTripId(newTrip._id);
    setCreateWizardOpen(false);
    setSwitcherOpen(false);
    navigate("/today");
  }

  function openDeleteDialog() {
    setDeleteDialogOpen(true);
  }

  async function handleExportTrip() {
    if (!trip) return;
    setIsExporting(true);
    try {
      const data = await tripsApi.export(trip._id);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const slug =
        trip.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "trip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.trippio.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSwitcherOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export trip");
    } finally {
      setIsExporting(false);
    }
  }

  function openImportPicker() {
    setSwitcherOpen(false);
    importFileInputRef.current?.click();
  }

  async function handleImportFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const newTrip = await importTrip.mutateAsync(parsed);
      toast.success(`Imported "${newTrip.name}"`);
      setSelectedTripId(newTrip._id);
      navigate("/today");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not import trip — is this a Trippio export file?",
      );
    }
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
      <header className="shrink-0 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          {/* Left: Wordmark + trip selector */}
          <div className="flex items-center gap-3">
            <span className="seal-mark h-6 w-6 text-[11px]" aria-hidden="true">
              T
            </span>
            <span className="sr-only">Trippio</span>
            <button
              type="button"
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors press-scale min-w-0 max-w-[180px]"
            >
              <span className="truncate">{trip.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
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
      <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] rounded-t-2xl bg-elev-1 border-t border-border flex flex-col"
        >
          <SheetHeader className="text-left pb-2 shrink-0">
            <SheetTitle className="sr-only">Trip</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pt-1 px-4 pb-6">
            <TripCover trip={trip} days={days} />

            {/* Trip-level destinations. These used to sit behind a "More" tab,
                which put Bookings two taps deep — the wrong place for the thing
                you need in a hurry at an airport. */}
            <div className="mt-4 flex flex-col">
              {tripSections
                .filter((section) => !(isReadOnly && section.path === "/access"))
                .map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.path}
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false);
                      navigate(section.path);
                    }}
                    className="flex items-center gap-3 rounded-[3px] px-3 py-3 text-left text-sm hover-lift border-b border-border last:border-b-0"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{section.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>

            {!isReadOnly && (
              <>
            <p className="text-section-label mt-6 mb-2">Your trips</p>
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
              </>
            )}

            {canShowActions && (
              <>
                <Separator className="my-3" />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setCreateWizardOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-elev-2 transition-colors"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Create trip
                  </button>
                  <button
                    type="button"
                    onClick={openImportPicker}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-elev-2 transition-colors"
                  >
                    <Upload className="h-4 w-4 shrink-0" />
                    Import trip from file
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleExportTrip}
                      disabled={isExporting}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-elev-2 transition-colors disabled:opacity-50"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      {isExporting ? "Exporting…" : "Export trip to file"}
                    </button>
                  )}
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

      <CreateTripWizard
        open={createWizardOpen}
        onOpenChange={setCreateWizardOpen}
        onSuccess={handleCreateTripSuccess}
      />

      <input
        ref={importFileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFileSelected}
        className="hidden"
      />

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
