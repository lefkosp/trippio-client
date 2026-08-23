import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Search,
  Plus,
  Phone,
  Navigation,
  StickyNote,
  UtensilsCrossed,
  Landmark,
  Building2,
  Shrub,
  CalendarClock,
  CalendarPlus,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import { PlaceName } from "@/components/place-name";
import { MetroLine, AdvanceBookingNote } from "@/components/place-meta";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePlaces, useDays } from "@/shared/hooks/queries";
import {
  useCreatePlace,
  useUpdatePlace,
  useCreateEvent,
  useEnrichPlace,
} from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { useAuth } from "@/auth/useAuth";
import { mapLink } from "@/lib/mapLink";
import type { Place } from "@/shared/types";
import type { PlaceEnrichment } from "@/shared/api/client";

const tagConfig: Record<string, { bgClass: string; fgClass: string }> = {
  food: { bgClass: "bg-event-food", fgClass: "text-event-food-foreground" },
  shrine: { bgClass: "bg-city-3", fgClass: "text-city-3-foreground" },
  museum: { bgClass: "bg-event-hotel", fgClass: "text-event-hotel-foreground" },
  sight: { bgClass: "bg-event-sight", fgClass: "text-event-sight-foreground" },
};

const placeTagFilters: FilterOption[] = [
  { value: "food", label: "Food", icon: UtensilsCrossed, bgClass: "bg-event-food", fgClass: "text-event-food-foreground" },
  { value: "sight", label: "Sight", icon: Landmark, bgClass: "bg-event-sight", fgClass: "text-event-sight-foreground" },
  { value: "shrine", label: "Shrine", icon: Shrub, bgClass: "bg-city-3", fgClass: "text-city-3-foreground" },
  { value: "museum", label: "Museum", icon: Building2, bgClass: "bg-event-hotel", fgClass: "text-event-hotel-foreground" },
];

// ─── PlaceCard ──────────────────────────────────────────────────────────────

function PlaceCard({
  place,
  onClick,
}: {
  place: Place;
  onClick: () => void;
}) {
  const tags = place.tags ?? [];
  const href = mapLink(place);

  return (
    <Card className="press-scale cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        {/* Name + maps button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <PlaceName
              place={place}
              tone="detail"
              className="font-semibold text-sm"
            />
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {place.address}
            </p>
            <MetroLine place={place} className="mt-1.5" />
            <AdvanceBookingNote place={place} className="mt-1.5" />
          </div>
          {href && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => {
              const tc = tagConfig[tag];
              return (
                <span
                  key={tag}
                  className={`badge-subtle ${tc ? `${tc.bgClass} ${tc.fgClass}` : "bg-elev-2 text-muted-foreground"}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Phone */}
        {place.phone && (
          <div
            className="flex items-center gap-2 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3 text-muted-foreground" />
            <a
              href={`tel:${place.phone}`}
              className="text-primary hover:underline"
            >
              {place.phone}
            </a>
          </div>
        )}

        {/* Notes */}
        {place.notes && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            {place.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PlaceDetailSheet ───────────────────────────────────────────────────────

function PlaceDetailSheet({
  place,
  open,
  onOpenChange,
  onAssign,
  onEdit,
  isReadOnly,
}: {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (place: Place) => void;
  onEdit: (place: Place) => void;
  isReadOnly: boolean;
}) {
  if (!place) return null;

  const tags = place.tags ?? [];
  const href = mapLink(place);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2 shrink-0">
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => {
                const tc = tagConfig[tag];
                return (
                  <span
                    key={tag}
                    className={`badge-subtle ${tc ? `${tc.bgClass} ${tc.fgClass}` : "bg-elev-2 text-muted-foreground"}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
          <SheetTitle className="text-xl tracking-tight">
            {place.name}
          </SheetTitle>
          {place.nameZh && (
            <p lang="zh-Hans" className="text-zh text-xl text-foreground/90">
              {place.nameZh}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-2 px-4 pb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">{place.address}</p>
          </div>

          {place.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${place.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {place.phone}
              </a>
            </div>
          )}

          <MetroLine place={place} className="text-sm" />

          {place.requiresAdvanceBooking && (
            <div className="flex items-center gap-3 rounded-lg bg-warning/10 px-3 py-2">
              <CalendarClock className="h-4 w-4 text-warning-foreground shrink-0" />
              <p className="text-xs text-warning-foreground">
                Requires advance booking
                {place.bookingWindowDays
                  ? ` — book at least ${place.bookingWindowDays} day${place.bookingWindowDays === 1 ? "" : "s"} ahead`
                  : ""}
              </p>
            </div>
          )}

          {href && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/20 text-primary hover:bg-primary/10"
              asChild
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4 mr-2" />
                Open in Maps
              </a>
            </Button>
          )}

          {!isReadOnly && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => onAssign(place)}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Assign to day
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => onEdit(place)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}

          {place.notes && (
            <>
              <Separator className="bg-border" />
              <div className="flex items-start gap-3">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{place.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── AssignToDaySheet ───────────────────────────────────────────────────────
// The other half of the shortlist → day-assignment loop: promoting a
// proposal creates the Place, this is what puts it on the itinerary.

function AssignToDaySheet({
  place,
  open,
  onOpenChange,
}: {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { tripId } = useTripContext();
  const { data: days = [] } = useDays(tripId);
  const [dayId, setDayId] = useState("");
  const createEvent = useCreateEvent(dayId);

  useEffect(() => {
    if (open) setDayId("");
  }, [open]);

  function handleAssign() {
    if (!place || !dayId) return;
    createEvent.mutate(
      { title: place.name, placeId: place._id, type: "sight", order: 0 },
      {
        onSuccess: () => {
          const day = days.find((d) => d._id === dayId);
          toast.success(`Added to Day ${day?.dayNumber ?? ""}`);
          onOpenChange(false);
          navigate(`/itinerary/${dayId}`);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  if (!place) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80dvh] rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2 shrink-0">
          <SheetTitle className="text-lg tracking-tight">Assign to day</SheetTitle>
          <p className="text-sm text-muted-foreground leading-snug">{place.name}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-1 px-4 pb-6">
          {days.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Lay out the days first, over on Itinerary.
            </p>
          ) : (
            <div>
              <label className="text-section-label mb-1.5 block">Day</label>
              <select
                value={dayId}
                onChange={(e) => setDayId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              >
                <option value="">Select a day…</option>
                {days.map((day) => (
                  <option key={day._id} value={day._id}>
                    Day {day.dayNumber}
                    {day.city ? ` — ${day.city}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAssign}
              disabled={!dayId || createEvent.isPending}
            >
              {createEvent.isPending ? "Adding…" : "Assign"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── EnrichmentPanel ────────────────────────────────────────────────────────
// Claude's suggested Place details. Purely presentational — the parent owns the
// form state and decides what "apply" means, so nothing here can touch a field
// the user hasn't explicitly accepted.

interface EnrichmentRow {
  key: string;
  label: string;
  display: string;
}

/** Skips every field that came back null — null means "not confirmed", not "empty". */
function buildEnrichmentRows(fields: PlaceEnrichment["fields"]): EnrichmentRow[] {
  const rows: EnrichmentRow[] = [];
  if (fields.name) rows.push({ key: "name", label: "English name", display: fields.name });
  if (fields.nameZh) rows.push({ key: "nameZh", label: "Chinese name", display: fields.nameZh });
  if (fields.metroLine)
    rows.push({ key: "metroLine", label: "Metro line", display: fields.metroLine });
  if (fields.metroStation)
    rows.push({ key: "metroStation", label: "Metro station", display: fields.metroStation });
  // The day count is meaningless on its own, so the flag and the window are one
  // row that applies together.
  if (fields.requiresAdvanceBooking !== null) {
    const days = fields.bookingWindowDays;
    rows.push({
      key: "booking",
      label: "Advance booking",
      display: fields.requiresAdvanceBooking
        ? days != null
          ? `Yes, ${days} days ahead`
          : "Yes"
        : "Not required",
    });
  }
  return rows;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function EnrichmentPanel({
  enrichment,
  rows,
  appliedKeys,
  onApply,
  onApplyAll,
  onDismiss,
}: {
  enrichment: PlaceEnrichment;
  rows: EnrichmentRow[];
  appliedKeys: Set<string>;
  onApply: (key: string) => void;
  onApplyAll: () => void;
  onDismiss: () => void;
}) {
  const allApplied = rows.length > 0 && rows.every((r) => appliedKeys.has(r.key));

  return (
    <div className="rounded-md border border-border bg-elev-2 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-section-label">Suggestions</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-1 text-muted-foreground"
          onClick={onDismiss}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-snug">
          Nothing could be confirmed for this place.
        </p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row) => {
            const applied = appliedKeys.has(row.key);
            return (
              <div key={row.key} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0 w-28">{row.label}</span>
                <span className="flex-1 min-w-0 truncate">{row.display}</span>
                <Button
                  variant={applied ? "ghost" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  disabled={applied}
                  onClick={() => onApply(row.key)}
                >
                  {applied ? "Applied" : "Use"}
                </Button>
              </div>
            );
          })}
          {rows.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs mt-1"
              disabled={allApplied}
              onClick={onApplyAll}
            >
              {allApplied ? "All applied" : "Apply all"}
            </Button>
          )}
        </div>
      )}

      {enrichment.note && (
        <p className="text-xs text-muted-foreground leading-snug">{enrichment.note}</p>
      )}

      {enrichment.sources.length > 0 && (
        <p className="text-xs text-muted-foreground leading-snug">
          Verify before saving ·{" "}
          {enrichment.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {hostOf(s.url)}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

// ─── AddPlaceSheet ──────────────────────────────────────────────────────────

function AddPlaceSheet({
  open,
  onOpenChange,
  editingPlace,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the sheet edits this place in place instead of creating a new one. */
  editingPlace?: Place | null;
}) {
  const { tripId } = useTripContext();
  const createPlace = useCreatePlace(tripId);
  const updatePlace = useUpdatePlace(tripId);
  const enrichPlace = useEnrichPlace(tripId);
  const isEditing = Boolean(editingPlace);
  const saveMutation = isEditing ? updatePlace : createPlace;

  const [name, setName] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [metroStation, setMetroStation] = useState("");
  const [metroLine, setMetroLine] = useState("");
  const [requiresAdvanceBooking, setRequiresAdvanceBooking] = useState(false);
  const [bookingWindowDays, setBookingWindowDays] = useState("");
  const [notes, setNotes] = useState("");
  const [enrichment, setEnrichment] = useState<PlaceEnrichment | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());

  const enrichmentRows = useMemo(
    () => (enrichment ? buildEnrichmentRows(enrichment.fields) : []),
    [enrichment]
  );

  function reset() {
    setName("");
    setNameZh("");
    setAddress("");
    setPhone("");
    setTagsInput("");
    setGoogleMapsUrl("");
    setMetroStation("");
    setMetroLine("");
    setRequiresAdvanceBooking(false);
    setBookingWindowDays("");
    setNotes("");
    setEnrichment(null);
    setAppliedKeys(new Set());
  }

  // Seed the form from the place being edited only when the sheet opens,
  // so it doesn't clobber in-progress edits on unrelated re-renders.
  useEffect(() => {
    if (!open) return;
    // Clear on both branches below — otherwise suggestions from a previous
    // place leak into the next sheet that opens.
    setEnrichment(null);
    setAppliedKeys(new Set());
    if (editingPlace) {
      setName(editingPlace.name ?? "");
      setNameZh(editingPlace.nameZh ?? "");
      setAddress(editingPlace.address ?? "");
      setPhone(editingPlace.phone ?? "");
      setTagsInput((editingPlace.tags ?? []).join(", "));
      setGoogleMapsUrl(editingPlace.googleMapsUrl ?? "");
      setMetroStation(editingPlace.metroStation ?? "");
      setMetroLine(editingPlace.metroLine ?? "");
      setRequiresAdvanceBooking(Boolean(editingPlace.requiresAdvanceBooking));
      setBookingWindowDays(
        editingPlace.bookingWindowDays ? String(editingPlace.bookingWindowDays) : ""
      );
      setNotes(editingPlace.notes ?? "");
    } else {
      reset();
    }
  }, [open, editingPlace]);

  function handleLookup() {
    if (!name.trim()) return;
    enrichPlace.mutate(
      { name: name.trim(), address: address.trim() || undefined },
      {
        onSuccess: (data) => {
          setEnrichment(data);
          setAppliedKeys(new Set());
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function applyField(key: string) {
    const f = enrichment?.fields;
    if (!f) return;
    if (key === "name" && f.name) setName(f.name);
    if (key === "nameZh" && f.nameZh) setNameZh(f.nameZh);
    if (key === "metroLine" && f.metroLine) setMetroLine(f.metroLine);
    if (key === "metroStation" && f.metroStation) setMetroStation(f.metroStation);
    if (key === "booking" && f.requiresAdvanceBooking !== null) {
      setRequiresAdvanceBooking(f.requiresAdvanceBooking);
      setBookingWindowDays(f.bookingWindowDays != null ? String(f.bookingWindowDays) : "");
    }
    setAppliedKeys((prev) => new Set(prev).add(key));
  }

  function applyAllFields() {
    enrichmentRows.forEach((row) => applyField(row.key));
  }

  function handleSave() {
    if (!name.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const data = {
      name: name.trim(),
      nameZh: nameZh.trim() || undefined,
      address: address.trim(),
      phone: phone || undefined,
      tags: tags.length > 0 ? tags : undefined,
      googleMapsUrl: googleMapsUrl || undefined,
      metroStation: metroStation.trim() || undefined,
      metroLine: metroLine.trim() || undefined,
      requiresAdvanceBooking: requiresAdvanceBooking || undefined,
      bookingWindowDays: bookingWindowDays ? Number(bookingWindowDays) : undefined,
      notes: notes || undefined,
    };

    const onSuccess = () => {
      reset();
      onOpenChange(false);
    };

    if (isEditing && editingPlace) {
      updatePlace.mutate({ placeId: editingPlace._id, data }, { onSuccess });
    } else {
      createPlace.mutate(data, { onSuccess });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2 shrink-0">
          <SheetTitle className="text-lg tracking-tight">
            {isEditing ? "Edit Place" : "Add Place"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-1 px-4 pb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleLookup}
            disabled={!name.trim() || enrichPlace.isPending}
          >
            <Sparkles className="size-4 mr-1.5" />
            {enrichPlace.isPending ? "Looking up…" : "Look up China details"}
          </Button>

          {enrichment && (
            <EnrichmentPanel
              enrichment={enrichment}
              rows={enrichmentRows}
              appliedKeys={appliedKeys}
              onApply={applyField}
              onApplyAll={applyAllFields}
              onDismiss={() => setEnrichment(null)}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">Name</label>
              <Input
                placeholder="e.g. Senso-ji Temple"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-section-label mb-1.5 block">
                Chinese name <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                placeholder="e.g. 天坛"
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-section-label mb-1.5 block">Address</label>
            <Input
              placeholder="Full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">Phone</label>
              <Input
                placeholder="+81-..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-section-label mb-1.5 block">Tags</label>
              <Input
                placeholder="food, shrine..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">
                Metro line <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Line 2"
                value={metroLine}
                onChange={(e) => setMetroLine(e.target.value)}
              />
            </div>
            <div>
              <label className="text-section-label mb-1.5 block">
                Metro station <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Tiantan Dongmen"
                value={metroStation}
                onChange={(e) => setMetroStation(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-section-label mb-1.5 block">
              Maps link <span className="text-muted-foreground/60">(optional override)</span>
            </label>
            <Input
              placeholder="Leave blank to open by address automatically"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires-advance-booking"
              checked={requiresAdvanceBooking}
              onChange={(e) => setRequiresAdvanceBooking(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="requires-advance-booking" className="text-sm">
              Requires advance booking
            </label>
            {requiresAdvanceBooking && (
              <Input
                type="number"
                min={1}
                placeholder="days ahead"
                value={bookingWindowDays}
                onChange={(e) => setBookingWindowDays(e.target.value)}
                className="w-28 ml-auto"
              />
            )}
          </div>
          <div>
            <label className="text-section-label mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Any helpful notes..."
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
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={!name.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : isEditing ? "Save Changes" : "Save Place"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── PlacesScreen ───────────────────────────────────────────────────────────

export function PlacesScreen() {
  const { tripId } = useTripContext();
  const { isReadOnly } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { data: places, isLoading } = usePlaces(
    tripId,
    searchQuery || undefined
  );

  // Client-side tag filter
  const filteredPlaces = useMemo(() => {
    if (!places) return undefined;
    if (!activeTag) return places;
    return places.filter((p) => p.tags?.includes(activeTag));
  }, [places, activeTag]);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignPlace, setAssignPlace] = useState<Place | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-6 pb-3 glass border-b border-border/50 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Places</h1>
          {!isReadOnly && (
            <Button
              size="sm"
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Place
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search places..."
            className="pl-9 bg-elev-1 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag filter */}
        <FilterChips
          options={placeTagFilters}
          selected={activeTag}
          onChange={setActiveTag}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredPlaces && filteredPlaces.length > 0 ? (
        <div key={activeTag ?? "all"} className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place._id}
              place={place}
              onClick={() => {
                setSelectedPlace(place);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {searchQuery || activeTag
              ? "Nothing matches that"
              : "No places saved yet"}
          </p>
          {!searchQuery && !activeTag && !isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add your first place
            </Button>
          )}
        </div>
      )}

      {!isReadOnly && <AddPlaceSheet open={addOpen} onOpenChange={setAddOpen} />}
      <PlaceDetailSheet
        place={selectedPlace}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isReadOnly={isReadOnly}
        onAssign={(place) => {
          setDetailOpen(false);
          setAssignPlace(place);
          setAssignOpen(true);
        }}
        onEdit={(place) => {
          setDetailOpen(false);
          setEditingPlace(place);
          setEditOpen(true);
        }}
      />
      <AssignToDaySheet
        place={assignPlace}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
      {!isReadOnly && (
        <AddPlaceSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          editingPlace={editingPlace}
        />
      )}
    </div>
  );
}
