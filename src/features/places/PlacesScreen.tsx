import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { usePlaces } from "@/shared/hooks/queries";
import { useCreatePlace } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import type { Place } from "@/shared/types";

const tagConfig: Record<string, { bgClass: string; fgClass: string }> = {
  food: { bgClass: "bg-event-food", fgClass: "text-event-food-foreground" },
  shrine: { bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
  museum: { bgClass: "bg-event-hotel", fgClass: "text-event-hotel-foreground" },
  sight: { bgClass: "bg-event-sight", fgClass: "text-event-sight-foreground" },
};

const placeTagFilters: FilterOption[] = [
  { value: "food", label: "Food", icon: UtensilsCrossed, bgClass: "bg-event-food", fgClass: "text-event-food-foreground" },
  { value: "sight", label: "Sight", icon: Landmark, bgClass: "bg-event-sight", fgClass: "text-event-sight-foreground" },
  { value: "shrine", label: "Shrine", icon: Shrub, bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
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

  return (
    <Card className="press-scale cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        {/* Name + maps button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{place.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {place.address}
            </p>
          </div>
          {place.googleMapsUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
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
}: {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!place) return null;

  const tags = place.tags ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
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
        </SheetHeader>

        <div className="space-y-4 pt-2 px-4 pb-6">
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

          {place.googleMapsUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/20 text-primary hover:bg-primary/10"
              asChild
            >
              <a
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Open in Google Maps
              </a>
            </Button>
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

// ─── AddPlaceSheet ──────────────────────────────────────────────────────────

function AddPlaceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tripId } = useTripContext();
  const createPlace = useCreatePlace(tripId);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setAddress("");
    setPhone("");
    setTagsInput("");
    setGoogleMapsUrl("");
    setNotes("");
  }

  function handleSave() {
    if (!name.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    createPlace.mutate(
      {
        name: name.trim(),
        address: address.trim(),
        phone: phone || undefined,
        tags: tags.length > 0 ? tags : undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          reset();
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
          <SheetTitle className="text-lg tracking-tight">Add Place</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-1 px-4 pb-6">
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
          <div>
            <label className="text-section-label mb-1.5 block">
              Google Maps URL
            </label>
            <Input
              placeholder="https://maps.google.com/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
            />
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
              disabled={!name.trim() || createPlace.isPending}
            >
              {createPlace.isPending ? "Saving..." : "Save Place"}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Places</h1>
        <Button
          size="sm"
          className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Place
        </Button>
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredPlaces && filteredPlaces.length > 0 ? (
        <div className="space-y-3">
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
              ? "No places match your filters"
              : "No places saved yet"}
          </p>
          {!searchQuery && !activeTag && (
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

      <AddPlaceSheet open={addOpen} onOpenChange={setAddOpen} />
      <PlaceDetailSheet
        place={selectedPlace}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
