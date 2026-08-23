import { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  StickyNote,
  Check,
  SkipForward,
  RotateCcw,
  Trash2,
  Pencil,
  Repeat2,
  History,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { eventTypeConfig, eventStatusConfig, transitSummary } from "@/shared/utils/event-helpers";
import { PlaceName } from "@/components/place-name";
import { MetroLine, AdvanceBookingNote } from "@/components/place-meta";
import { useUpdateEvent, useDeleteEvent } from "@/shared/hooks/mutations";
import { mapLink } from "@/lib/mapLink";
import { formatDate } from "@/lib/utils";
import type { TripEvent, EventStatus } from "@/shared/types";
import { useAuth } from "@/auth/useAuth";
import { EditEventProposalSheet } from "./EditEventProposalSheet";
import { ReplaceEventProposalSheet } from "./ReplaceEventProposalSheet";

interface EventSheetProps {
  event: TripEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: string;
}

export function EventSheet({ event, open, onOpenChange, dayId }: EventSheetProps) {
  const { isReadOnly } = useAuth();
  const updateEvent = useUpdateEvent(dayId);
  const deleteEvent = useDeleteEvent(dayId);
  const [editOpen, setEditOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  if (!event) return null;

  const typeConfig = eventTypeConfig[event.type];
  const statusConfig = eventStatusConfig[event.status];
  const TypeIcon = typeConfig.icon;
  const placeMapLink = event.place ? mapLink(event.place) : null;

  const handleStatusChange = (newStatus: EventStatus) => {
    updateEvent.mutate({ eventId: event._id, data: { status: newStatus } });
  };

  const handleDelete = () => {
    deleteEvent.mutate(event._id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl bg-elev-1 border-t border-border">
        <SheetHeader className="text-left pb-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge-subtle ${typeConfig.bgClass} ${typeConfig.fgClass}`}>
              <TypeIcon className="h-3 w-3" />
              {typeConfig.label}
            </span>
            <span className={`badge-subtle ${
              event.status === "done"
                ? "bg-success text-success-foreground"
                : event.status === "skipped"
                  ? "bg-elev-2 text-muted-foreground"
                  : "bg-elev-2 text-muted-foreground"
            }`}>
              {statusConfig.label}
            </span>
          </div>
          <SheetTitle className="text-xl tracking-tight">{event.title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-2 px-4 pb-6">
          {!isReadOnly && (
            <>
              {/* Status actions */}
              <div className="flex gap-2">
                {event.status !== "done" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-success/30 text-success-foreground hover:bg-success/20 press-scale"
                    onClick={() => handleStatusChange("done")}
                    disabled={updateEvent.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Mark Done
                  </Button>
                )}
                {event.status !== "skipped" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border text-muted-foreground hover:bg-elev-2 press-scale"
                    onClick={() => handleStatusChange("skipped")}
                    disabled={updateEvent.isPending}
                  >
                    <SkipForward className="h-3.5 w-3.5 mr-1" />
                    Skip
                  </Button>
                )}
                {event.status !== "planned" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-border text-muted-foreground hover:bg-elev-2 press-scale"
                    onClick={() => handleStatusChange("planned")}
                    disabled={updateEvent.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Time */}
          {event.startTime && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {event.startTime}
                {event.endTime && ` — ${event.endTime}`}
              </span>
            </div>
          )}

          {/* Place info */}
          {event.place && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <PlaceName
                      place={event.place}
                      tone="detail"
                      className="text-sm font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      {event.place.address}
                    </p>
                    <MetroLine place={event.place} />
                    <AdvanceBookingNote place={event.place} />
                  </div>
                </div>
                {event.place.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${event.place.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {event.place.phone}
                    </a>
                  </div>
                )}
                {placeMapLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 text-primary hover:bg-primary/10"
                    asChild
                  >
                    <a
                      href={placeMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Open in Maps
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Transit — only when there's something under the heading to show.
              A transit object carrying nothing but `mode` rendered as a
              "Transit / Walk" header with an empty body. */}
          {event.transit && transitSummary(event.transit) && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Navigation className="h-4 w-4 text-event-transport-foreground" />
                  <span>Transit</span>
                  {event.transit.mode && (
                    <span className="badge-subtle bg-elev-2 text-muted-foreground capitalize">
                      {event.transit.mode}
                    </span>
                  )}
                </div>
                {(event.transit.from || event.transit.to) && (
                  <p className="text-sm text-muted-foreground pl-6">
                    {event.transit.from && <span>{event.transit.from}</span>}
                    {event.transit.from && event.transit.to && " → "}
                    {event.transit.to && <span>{event.transit.to}</span>}
                  </p>
                )}
                {event.transit.instructions && (
                  <div className="rounded-lg p-3 ml-6 bg-elev-2 border border-border">
                    <p className="text-sm">{event.transit.instructions}</p>
                  </div>
                )}
                {event.transit.links?.map((link, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="ml-6 text-xs text-primary"
                    asChild
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Route link
                    </a>
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* Notes */}
          {event.notes && (
            <>
              <Separator className="bg-border" />
              <div className="flex items-start gap-3">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </div>
            </>
          )}

          {/* Links */}
          {event.links && event.links.length > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-1.5">
                <p className="text-section-label">Links</p>
                {event.links.map((link, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-primary"
                    asChild
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {(() => {
                        try {
                          return new URL(link).hostname;
                        } catch {
                          return "Link";
                        }
                      })()}
                    </a>
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* History — edits/replaces applied via a proposal */}
          {event.history && event.history.length > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-1.5">
                <p className="text-section-label">History</p>
                {event.history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {entry.summary || (entry.type === "replace" ? "Replaced" : "Edited")}
                      {entry.changedAt && (
                        <span className="text-muted-foreground/60">
                          {" "}
                          · {formatDate(entry.changedAt, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isReadOnly && (
            <>
              {/* Manage — edit/replace go through a proposal so the change is
                  a record the group can see, applied now or after a vote. */}
              <Separator className="bg-border" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs border-border text-muted-foreground hover:bg-elev-2 press-scale"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs border-border text-muted-foreground hover:bg-elev-2 press-scale"
                  onClick={() => setReplaceOpen(true)}
                >
                  <Repeat2 className="h-3.5 w-3.5 mr-1" />
                  Replace
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-danger-foreground hover:bg-danger/20"
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {deleteEvent.isPending ? "Deleting..." : "Delete Event"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <EditEventProposalSheet
      event={event}
      open={editOpen}
      onOpenChange={setEditOpen}
    />
    <ReplaceEventProposalSheet
      event={event}
      open={replaceOpen}
      onOpenChange={setReplaceOpen}
    />
    </>
  );
}
