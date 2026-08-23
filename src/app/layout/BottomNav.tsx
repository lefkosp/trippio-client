import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Map, Sun, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTripContext } from "@/shared/context/useTripContext";
import { useProposals } from "@/shared/hooks/queries";

// Four tabs, no "More". A fifth tab that is only a menu is what a scaffold
// produces when the information architecture wasn't decided — and it buried
// Bookings, the thing you need in a hurry at an airport, two taps deep.
// Places, Bookings and Sharing are trip-level, so they live in the trip sheet
// behind the trip name in the top bar, next to the trip cover.
const tabs = [
  { path: "/today", label: "Today", icon: Sun },
  { path: "/itinerary", label: "Days", icon: CalendarDays },
  { path: "/map", label: "Map", icon: Map },
  { path: "/proposals", label: "Ideas", icon: Lightbulb },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId } = useTripContext();
  const { data: openProposals = [] } = useProposals(tripId, { status: "open" });
  const openCount = openProposals.length;

  const isActive = (path: string) => {
    if (path === "/itinerary") {
      return location.pathname.startsWith("/itinerary");
    }
    if (path === "/proposals") {
      return location.pathname.startsWith("/proposals");
    }
    return location.pathname === path;
  };

  return (
    // A flush, opaque bar rather than a floating translucent pill. The pill sat
    // on top of live content at 55% opacity, so card text on Places and
    // Bookings read straight through the navigation — the blur was doing
    // aesthetic work at the cost of legibility on the densest screens. The
    // active tab is marked by a seal rule on the top edge, like a signage tab.
    <nav className="fixed inset-x-0 bottom-0 z-50">
      {/* Background on the inner column, not the full-width nav: otherwise a
          desktop gets an elevated strip running edge to edge behind a 448px
          app. */}
      <div className="max-w-md mx-auto flex items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-elev-1 border-t border-border md:border-x">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 pt-3 pb-1.5 min-h-[52px] transition-colors duration-200 press-scale",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {active && (
                <span
                  className="absolute inset-x-3 top-0 h-0.5 bg-primary"
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-6 transition-colors duration-200",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    active && "stroke-[2.5px]",
                  )}
                />
                {tab.path === "/proposals" && openCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center leading-none"
                    aria-label={`${openCount} open proposals`}
                  >
                    {openCount > 9 ? "9+" : openCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  active ? "text-primary font-semibold" : "text-muted-foreground font-medium",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
