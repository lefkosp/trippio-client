import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Map,
  Sun,
  Lightbulb,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTripContext } from "@/shared/context/useTripContext";
import { useProposals } from "@/shared/hooks/queries";

const tabs = [
  { path: "/today", label: "Today", icon: Sun },
  { path: "/itinerary", label: "Itinerary", icon: CalendarDays },
  { path: "/proposals", label: "Proposals", icon: Lightbulb },
  { path: "/map", label: "Map", icon: Map },
  { path: "/more", label: "More", icon: MoreHorizontal },
] as const;

const moreTabPaths = ["/more", "/places", "/bookings", "/access"];

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
    if (path === "/more") {
      return moreTabPaths.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom">
      <div
        className="flex items-center justify-around max-w-md mx-auto px-2"
        style={{ height: "60px" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[44px] rounded-xl transition-all duration-200 press-scale",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {/* Active pill glow */}
              {active && (
                <div className="absolute inset-x-2 -top-px h-0.5 rounded-full bg-primary/80" />
              )}
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-7 rounded-lg transition-colors duration-200",
                  active && "bg-accent",
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
                  "text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
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
