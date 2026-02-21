import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, LogOut, Users } from "lucide-react";
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
import { AccessManagementSheet } from "@/features/share/AccessManagementSheet";

export function TopBar() {
  const navigate = useNavigate();
  const { trip } = useTripContext();
  const { trips, setSelectedTripId } = useTripSwitcher();
  const { logout, user, isReadOnly } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const isOwner = user && trip.createdBy === user.id;

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
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setShareOpen(true)}
                    title="Sharing & Access"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
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

      {/* Sharing & Access Sheet */}
      {isOwner && (
        <AccessManagementSheet open={shareOpen} onOpenChange={setShareOpen} />
      )}
    </>
  );
}
