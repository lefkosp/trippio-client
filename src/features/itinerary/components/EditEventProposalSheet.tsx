import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDays } from "@/shared/hooks/queries";
import { useCreateProposal, useApproveProposal } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { eventTypeConfig } from "@/shared/utils/event-helpers";
import type { EditableEventChanges, EventType, TripEvent } from "@/shared/types";

const eventTypes: EventType[] = ["sight", "food", "transport", "hotel", "free"];

interface EditEventProposalSheetProps {
  event: TripEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventProposalSheet({ event, open, onOpenChange }: EditEventProposalSheetProps) {
  const { tripId } = useTripContext();
  const { data: days = [] } = useDays(tripId);
  const createProposal = useCreateProposal(tripId);
  const approveProposal = useApproveProposal(tripId);

  const [title, setTitle] = useState("");
  const [dayId, setDayId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState<EventType>("sight");
  const [notes, setNotes] = useState("");
  const [applyMode, setApplyMode] = useState<"immediate" | "vote">("immediate");

  // Seed from the event being edited only when the sheet opens, so it
  // doesn't clobber in-progress edits on unrelated re-renders.
  useEffect(() => {
    if (!open || !event) return;
    setTitle(event.title ?? "");
    setDayId(event.dayId ?? "");
    setStartTime(event.startTime ?? "");
    setEndTime(event.endTime ?? "");
    setType(event.type ?? "sight");
    setNotes(event.notes ?? "");
    setApplyMode("immediate");
  }, [open, event]);

  const isSaving = createProposal.isPending || approveProposal.isPending;

  function buildChanges(): EditableEventChanges {
    if (!event) return {};
    const changes: EditableEventChanges = {};
    if (title.trim() && title.trim() !== event.title) changes.title = title.trim();
    if (dayId && dayId !== event.dayId) changes.dayId = dayId;
    if (startTime !== (event.startTime ?? "")) changes.startTime = startTime || undefined;
    if (endTime !== (event.endTime ?? "")) changes.endTime = endTime || undefined;
    if (type !== event.type) changes.type = type;
    if (notes !== (event.notes ?? "")) changes.notes = notes || undefined;
    return changes;
  }

  function handleSave() {
    if (!event) return;
    const changes = buildChanges();
    if (Object.keys(changes).length === 0) {
      toast.error("Change something first");
      return;
    }

    createProposal.mutate(
      { title: `Edit: ${event.title}`, type: "edit", targetEventId: event._id, changes },
      {
        onSuccess: (proposal) => {
          if (applyMode === "vote") {
            toast.success("Sent to the group for a vote");
            onOpenChange(false);
            return;
          }
          approveProposal.mutate(proposal._id, {
            onSuccess: () => {
              toast.success("Event updated");
              onOpenChange(false);
            },
            onError: (e) => toast.error(e.message),
          });
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2 shrink-0">
          <SheetTitle className="text-lg tracking-tight">Edit Event</SheetTitle>
          <p className="text-sm text-muted-foreground leading-snug">{event.title}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-1 px-4 pb-6">
          <div>
            <label className="text-section-label mb-1.5 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">Day</label>
            <select
              value={dayId}
              onChange={(e) => setDayId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              {days.map((day) => (
                <option key={day._id} value={day._id}>
                  Day {day.dayNumber}
                  {day.city ? ` — ${day.city}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">Start</label>
              <TimePicker value={startTime} onChange={setStartTime} placeholder="Start time" />
            </div>
            <div>
              <label className="text-section-label mb-1.5 block">End</label>
              <TimePicker value={endTime} onChange={setEndTime} placeholder="End time" />
            </div>
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">Type</label>
            <div className="flex gap-1.5 flex-wrap">
              {eventTypes.map((t) => {
                const cfg = eventTypeConfig[t];
                const Icon = cfg.icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all press-scale border",
                      active
                        ? `${cfg.bgClass} ${cfg.fgClass} border-current`
                        : "bg-elev-2 text-muted-foreground border-transparent"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Any helpful details..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">When should this apply?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setApplyMode("immediate")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-all press-scale",
                  applyMode === "immediate"
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-elev-2 text-muted-foreground border-transparent"
                )}
              >
                Apply immediately
              </button>
              <button
                type="button"
                onClick={() => setApplyMode("vote")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-all press-scale",
                  applyMode === "vote"
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-elev-2 text-muted-foreground border-transparent"
                )}
              >
                Send for group vote
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : applyMode === "immediate" ? "Save changes" : "Send for vote"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
