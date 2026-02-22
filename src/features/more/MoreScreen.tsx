import { useNavigate } from "react-router-dom";
import { MapPin, Ticket, Share2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { path: "/places", label: "Places", icon: MapPin },
  { path: "/bookings", label: "Bookings", icon: Ticket },
  { path: "/access", label: "Sharing & Access", icon: Share2 },
] as const;

export function MoreScreen() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-page-title">More</h1>

      <div className="rounded-xl border border-border bg-elev-1 overflow-hidden">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-elev-2",
                index > 0 && "border-t border-border"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elev-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="flex-1 font-medium text-sm text-foreground">
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
