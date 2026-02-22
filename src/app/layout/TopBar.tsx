import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Check,
  Copy,
  Link,
  LogOut,
  Share2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTripContext } from "@/shared/context/useTripContext";
import { useTripSwitcher } from "@/shared/context/TripSwitcherContext";
import { useAuth } from "@/auth/useAuth";
import { tripsApi } from "@/shared/api/client";
import { toast } from "sonner";

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
          </div>
        </SheetContent>
      </Sheet>

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
