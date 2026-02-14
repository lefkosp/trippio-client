import { useState } from "react";
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
import { usePlaces } from "@/shared/hooks/queries";
import { useCreateEvent } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { eventTypeConfig } from "@/shared/utils/event-helpers";
import { cn } from "@/lib/utils";
import type { EventType, TransitMode } from "@/shared/types";
import { MapPin, X } from "lucide-react";

const eventTypes: EventType[] = ["sight", "food", "transport", "hotel", "free"];
const transitModes: { value: TransitMode; label: string }[] = [
  { value: "train", label: "Train" },
  { value: "walk", label: "Walk" },
  { value: "uber", label: "Uber" },
  { value: "bus", label: "Bus" },
  { value: "other", label: "Other" },
];

interface AddEventSheetProps {
  dayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEventSheet({ dayId, open, onOpenChange }: AddEventSheetProps) {
  const { tripId } = useTripContext();
  const { data: places } = usePlaces(tripId);
  const createEvent = useCreateEvent(dayId);

  // Form state
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [type, setType] = useState<EventType>("sight");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [transitMode, setTransitMode] = useState<TransitMode | "">("");
  const [transitNote, setTransitNote] = useState("");
  const [notes, setNotes] = useState("");
  const [showPlaces, setShowPlaces] = useState(false);

  const selectedPlace = places?.find((p) => p._id === selectedPlaceId);

  function resetForm() {
    setTitle("");
    setStartTime("");
    setType("sight");
    setSelectedPlaceId(null);
    setTransitMode("");
    setTransitNote("");
    setNotes("");
    setShowPlaces(false);
  }

  function handleSave() {
    if (!title.trim()) return;

    createEvent.mutate(
      {
        title: title.trim(),
        startTime: startTime || undefined,
        type,
        placeId: selectedPlaceId ?? undefined,
        transit:
          transitMode || transitNote
            ? {
                mode: (transitMode as TransitMode) || undefined,
                instructions: transitNote || undefined,
              }
            : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg tracking-tight">Add Event</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-1 px-4 pb-6">
          {/* Title */}
          <div>
            <label className="text-section-label mb-1.5 block">Title</label>
            <Input
              placeholder="e.g. Visit Senso-ji Temple"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Time + Type row */}
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">Time</label>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="Time"
              />
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
          </div>

          {/* Place selector */}
          <div>
            <label className="text-section-label mb-1.5 block">Place</label>
            {selectedPlace ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-elev-2 border border-border">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-sm flex-1 truncate">{selectedPlace.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPlaceId(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPlaces(!showPlaces)}
                className="w-full text-left text-sm text-muted-foreground p-2.5 rounded-lg bg-elev-2 border border-border hover:border-primary/30 transition-colors"
              >
                Tap to select a saved place...
              </button>
            )}
            {showPlaces && !selectedPlace && places && places.length > 0 && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-border bg-elev-2 divide-y divide-border">
                {places.map((place) => (
                  <button
                    key={place._id}
                    type="button"
                    onClick={() => {
                      setSelectedPlaceId(place._id);
                      setShowPlaces(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {place.address}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transit */}
          <div>
            <label className="text-section-label mb-1.5 block">Transit</label>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {transitModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() =>
                    setTransitMode(transitMode === m.value ? "" : m.value)
                  }
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all press-scale border",
                    transitMode === m.value
                      ? "bg-event-transport text-event-transport-foreground border-current"
                      : "bg-elev-2 text-muted-foreground border-transparent"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="e.g. Ginza Line to Asakusa, ~15 min"
              value={transitNote}
              onChange={(e) => setTransitNote(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-section-label mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Any helpful details..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={!title.trim() || createEvent.isPending}
            >
              {createEvent.isPending ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
