import { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation, MapPin, LocateFixed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDays, useEventsWithPlaces, usePlaces } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import { mapLink, wgs84ToGcj02 } from "@/lib/mapLink";
import { useMapTileSource, type MapTileSource } from "@/lib/mapTileSource";
import { PlaceName } from "@/components/place-name";
import { MetroLine } from "@/components/place-meta";
import { useUserLocation, type UserPosition } from "./useUserLocation";
import { toast } from "sonner";
import type { Day, Place } from "@/shared/types";

const TILE_CONFIG: Record<MapTileSource, { url: string; subdomains: string; attribution: string }> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    // Explicit, not omitted: react-leaflet forwards every prop straight into
    // Leaflet's options, so an omitted/undefined `subdomains` overwrites
    // Leaflet's own internal default ('abc') with `undefined` instead of
    // leaving it alone — reproduced live as a hard crash in `_getSubdomain`
    // ("Cannot read properties of undefined (reading 'length')").
    subdomains: "abc",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    // Carto "dark matter" — OSM data rendered dark, so the map stops being a
    // white rectangle punched into a near-black app. Same availability as OSM
    // (i.e. not in mainland China).
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  amap: {
    // Unofficial but widely-used public raster endpoint (no API key) — accessible
    // from mainland China without a VPN, unlike OSM's tile CDN. Coordinates must
    // be pre-shifted to GCJ-02 (see `displayPlaces` below) or every marker on
    // these tiles lands 100-700m off.
    url: "https://webrd0{s}.is.autonavi.com/appmaptile?lang=en&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    subdomains: "1234",
    attribution: "&copy; AutoNavi (高德地图)",
  },
};

// A drawn marker rather than Leaflet's bundled PNG pin.
//
// The previous approach — importing the three PNGs through Vite and passing
// them to L.Icon.Default.mergeOptions — silently produced a doubled URL and no
// marker has ever rendered on this map: Icon.Default._getIconUrl prefixes its
// auto-detected `imagePath` onto whatever you give it, so the already-absolute
// Vite URL came out as
//   /node_modules/leaflet/dist/images//node_modules/leaflet/dist/images/marker-icon-2x.png
// and every marker was a broken-image box. (Verified in the DOM: naturalWidth 0.)
//
// A divIcon sidesteps the whole imagePath mechanism, costs three fewer network
// requests, needs no assets cached for offline, and lets the pin be a signage
// dot in the app's own accent instead of Leaflet's default blue.
const placeIcon = L.divIcon({
  className: "trippio-marker",
  html: "<span></span>",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

/** You. Blue rather than the seal accent, because "where I am" and "somewhere
 *  I'm going" must never be confusable at a glance. */
const userIcon = L.divIcon({
  className: "trippio-marker-user",
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

function DaySelector({
  days,
  selectedDayId,
  onSelect,
}: {
  days: Day[];
  selectedDayId: string;
  onSelect: (dayId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide scroll-fade-x">
      {days.map((day) => {
        const active = selectedDayId === day._id;
        return (
          <button
            key={day._id}
            onClick={() => onSelect(day._id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 press-scale border ${
              active
                ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_rgba(228,87,74,0.18)]"
                : "bg-elev-1 text-muted-foreground border-border hover:border-border"
            }`}
          >
            D{day.dayNumber} · {day.city || "—"}
          </button>
        );
      })}
    </div>
  );
}

/** Refits the map viewport whenever the marker set changes — otherwise
 * switching between "This day" and "All places" leaves the old zoom/center. */
function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    const withCoords = places.filter((p) => p.lat && p.lng);
    if (withCoords.length === 0) return;
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat!, withCoords[0].lng!], 14);
      return;
    }
    const bounds = L.latLngBounds(withCoords.map((p) => [p.lat!, p.lng!] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [places, map]);
  return null;
}

/** A request to show one place on the map. Carries a nonce as well as the id so
 *  tapping the same place twice re-centres instead of doing nothing. */
export interface FocusRequest {
  placeId: string;
  nonce: number;
}

/** Flies to a place picked from the list and opens its popup. */
function FocusPlace({
  places,
  focus,
  markerRefs,
}: {
  places: Place[];
  focus: FocusRequest | null;
  markerRefs: React.RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const place = places.find((p) => p._id === focus.placeId);
    if (!place?.lat || !place?.lng) return;
    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 16), {
      duration: 0.6,
    });
    // Opened straight away rather than on `moveend`: the popup is anchored to
    // its marker and pans along with the map, and moveend doesn't fire at all
    // when the map is already sitting on the target — which left re-picking the
    // same place silently doing nothing.
    markerRefs.current?.get(focus.placeId)?.openPopup();
  }, [focus, places, map, markerRefs]);
  return null;
}

/** Pans to the user the first time a fix arrives, then leaves the map alone so
 *  it doesn't yank itself back every time the watch updates. */
function CenterOnFirstFix({ position }: { position: UserPosition | null }) {
  const map = useMap();
  const centred = useRef(false);
  useEffect(() => {
    if (!position || centred.current) return;
    centred.current = true;
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
  }, [position, map]);
  return null;
}

function LeafletMap({
  places,
  tileSource,
  userPosition,
  focus,
}: {
  places: Place[];
  tileSource: MapTileSource;
  userPosition: UserPosition | null;
  focus: FocusRequest | null;
}) {
  const withCoords = places.filter((p) => p.lat && p.lng);
  // Default center: Beijing — arbitrary, only used before any marker exists.
  const fallbackCenter: [number, number] = [39.9042, 116.4074];
  const tile = TILE_CONFIG[tileSource];
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={withCoords[0] ? [withCoords[0].lat!, withCoords[0].lng!] : fallbackCenter}
        zoom={12}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* Bottom-right: the default top-left position sat underneath the
            floating mode/day controls. */}
        <ZoomControl position="bottomright" />
        <TileLayer
          key={tileSource}
          attribution={tile.attribution}
          url={tile.url}
          subdomains={tile.subdomains}
        />
        <FitBounds places={withCoords} />
        <CenterOnFirstFix position={userPosition} />
        <FocusPlace places={withCoords} focus={focus} markerRefs={markerRefs} />

        {userPosition && (
          <>
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={userPosition.accuracy}
              pathOptions={{
                color: "#6ba6e8",
                fillColor: "#6ba6e8",
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
            <Marker
              position={[userPosition.lat, userPosition.lng]}
              icon={userIcon}
              zIndexOffset={1000}
            >
              <Popup>You're here</Popup>
            </Marker>
          </>
        )}

        {withCoords.map((place) => (
          <Marker
            key={place._id}
            position={[place.lat!, place.lng!]}
            icon={placeIcon}
            ref={(m) => {
              if (m) markerRefs.current.set(place._id, m);
              else markerRefs.current.delete(place._id);
            }}
          >
            {/* autoPan off so opening a popup doesn't fight the flyTo that
                brought us here. */}
            <Popup autoPan={false}>
              <span className="font-medium">{place.name}</span>
              {place.nameZh && (
                <>
                  <br />
                  <span lang="zh-Hans" className="text-zh">
                    {place.nameZh}
                  </span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

type MapMode = "day" | "all";

export function MapScreen() {
  const { tripId } = useTripContext();
  const { data: days, isLoading: daysLoading } = useDays(tripId);
  const [mode, setMode] = useState<MapMode>("day");

  const [selectedDayId, setSelectedDayId] = useState("");
  const effectiveDayId =
    selectedDayId ||
    (days && days.length > 0 ? (days[1]?._id ?? days[0]._id) : "");

  const { data: dayEvents, isLoading: dayEventsLoading } = useEventsWithPlaces(
    effectiveDayId,
    tripId
  );
  const { data: allPlaces, isLoading: allPlacesLoading } = usePlaces(tripId);

  const dayPlaces = useMemo(
    () =>
      dayEvents
        ?.filter((e) => e.place)
        .map((e) => e.place!)
        .filter(
          (place, index, arr) =>
            arr.findIndex((p) => p._id === place._id) === index
        ) ?? [],
    [dayEvents]
  );

  const [tileSource, setTileSource] = useMapTileSource();

  const places = useMemo(
    () => (mode === "day" ? dayPlaces : (allPlaces ?? [])),
    [mode, dayPlaces, allPlaces],
  );
  const placesLoading = mode === "day" ? dayEventsLoading : allPlacesLoading;
  // Memoized because `mapDisplayPlaces` below takes this as a dependency — as a
  // fresh array on every render it made that memo a no-op.
  const placesWithCoords = useMemo(
    () => places.filter((p) => p.lat && p.lng),
    [places],
  );
  const placesMissingCoords = useMemo(
    () => places.filter((p) => !p.lat || !p.lng),
    [places],
  );

  // Amap tiles are drawn in GCJ-02 — shift marker positions to match so pins
  // land on the right street instead of 100-700m off. Only affects what's
  // rendered on the map; stored place coordinates stay WGS-84.
  const mapDisplayPlaces = useMemo(
    () =>
      tileSource === "amap"
        ? placesWithCoords.map((p) => {
            const gcj = wgs84ToGcj02(p.lat!, p.lng!);
            return { ...p, lat: gcj.lat, lng: gcj.lng };
          })
        : placesWithCoords,
    [placesWithCoords, tileSource]
  );

  const { position: userPosition, status: locStatus, error: locError, toggle: toggleLocate } =
    useUserLocation();

  // The browser reports WGS-84. On Amap tiles that puts you on the wrong street
  // by 100-700m — the same shift the place pins already needed, and it matters
  // more here, because this is the dot you'd trust to tell you where you are.
  const userDisplayPosition = useMemo(() => {
    if (!userPosition) return null;
    if (tileSource !== "amap") return userPosition;
    const gcj = wgs84ToGcj02(userPosition.lat, userPosition.lng);
    return { ...userPosition, lat: gcj.lat, lng: gcj.lng };
  }, [userPosition, tileSource]);

  useEffect(() => {
    if (locError) toast.error(locError);
  }, [locError]);

  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  // A monotonic counter rather than a timestamp: same effect (re-picking the
  // same place still re-centres) without calling an impure function.
  const focusNonce = useRef(0);

  function showOnMap(place: Place) {
    if (!place.lat || !place.lng) return;
    // The list can be scrolled well past the map by the time you pick something
    // out of it, so bring the map back into view before flying to the pin —
    // otherwise the whole thing happens off-screen.
    //
    // Instant rather than `behavior: "smooth"`: smooth scrolling silently
    // no-ops on this container (both scrollIntoView and scrollTo, with
    // prefers-reduced-motion off), so asking for it means not scrolling at all.
    // The map's own flyTo supplies the motion cue.
    mapSectionRef.current?.scrollIntoView({ block: "start" });
    setFocus({ placeId: place._id, nonce: (focusNonce.current += 1) });
  }

  // A place picked while filtering by day may not exist in the other mode's
  // marker set, so the selection is cleared wherever the set changes. Done in
  // the handlers rather than an effect on [mode, effectiveDayId] — that's a
  // state update triggering a second render pass for something already known
  // at the moment of the click.
  function changeMode(next: MapMode) {
    setMode(next);
    setFocus(null);
  }

  function changeDay(dayId: string) {
    setSelectedDayId(dayId);
    setFocus(null);
  }

  if (daysLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Full-bleed to the column edges, but deliberately not full-screen. At
          62dvh the map covered nearly the whole phone, and since dragging on a
          map pans the map rather than scrolling the page, the list underneath
          was unreachable on touch; 38dvh fixed that but gave the map too little
          room to be useful. 48dvh keeps a readable map while still leaving
          roughly half the screen of list to swipe on. */}
      <div
        ref={mapSectionRef}
        className="relative -mx-4 h-[48dvh] min-h-[300px] max-h-[460px] border-b border-border overflow-hidden scroll-mt-2"
      >
        {placesLoading ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : (
          <LeafletMap
            places={mapDisplayPlaces}
            tileSource={tileSource}
            userPosition={userDisplayPosition}
            focus={focus}
          />
        )}

        {/* Floating controls */}
        <div className="absolute inset-x-0 top-0 z-[500] p-3 space-y-2.5 pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-full glass border border-border/60 p-0.5 pointer-events-auto">
              {(["day", "all"] as MapMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all press-scale ${
                    mode === m ? "bg-primary/20 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {m === "day" ? "This day" : "All places"}
                </button>
              ))}
            </div>

            {/* Tile source — OSM/dark work everywhere except mainland China;
                switch to Amap once you're actually there. */}
            <div className="flex items-center gap-1 rounded-full glass border border-border/60 p-0.5 pointer-events-auto">
              {(["dark", "osm", "amap"] as MapTileSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setTileSource(s)}
                  title={
                    s === "dark" ? "Dark" : s === "osm" ? "OpenStreetMap" : "Amap (works in China)"
                  }
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all press-scale ${
                    tileSource === s ? "bg-primary/20 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s === "dark" ? "Dark" : s === "osm" ? "OSM" : "Amap"}
                </button>
              ))}
            </div>
          </div>

          {/* Day selector — only relevant in "this day" mode */}
          {mode === "day" && days && (
            <div className="pointer-events-auto">
              <DaySelector
                days={days}
                selectedDayId={effectiveDayId}
                onSelect={changeDay}
              />
            </div>
          )}
        </div>

        {/* Where you are. Opt-in, so opening the Map tab never triggers an
            unprompted permission dialog. */}
        <button
          onClick={toggleLocate}
          aria-pressed={locStatus === "tracking"}
          title={locStatus === "tracking" ? "Stop following me" : "Show where I am"}
          className={`absolute bottom-3 left-3 z-[500] flex items-center gap-1.5 rounded-full glass border border-border/60 px-3 py-2 text-xs font-medium press-scale ${
            locStatus === "tracking" ? "text-info-foreground" : "text-muted-foreground"
          }`}
        >
          <LocateFixed
            className={`h-3.5 w-3.5 ${locStatus === "locating" ? "animate-pulse" : ""}`}
          />
          {locStatus === "locating"
            ? "Finding you…"
            : locStatus === "tracking"
              ? "Following"
              : "Where am I"}
        </button>

        {placesMissingCoords.length > 0 && (
          <p className="absolute bottom-3 right-16 z-[500] text-[11px] text-muted-foreground glass rounded-[3px] px-2 py-1 border border-border/60">
            {placesMissingCoords.length} not geocoded
          </p>
        )}
      </div>

      {/* Place list */}
      {placesLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : places.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-section-label">
            {mode === "day" ? "Places on this day" : `All places (${places.length})`}
          </h2>
          <div
            key={`${mode}-${effectiveDayId}`}
            className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            {places.map((place) => {
              const href = mapLink(place);
              const locatable = Boolean(place.lat && place.lng);
              const selected = focus?.placeId === place._id;
              return (
                <Card
                  key={place._id}
                  className={selected ? "border-primary/50" : undefined}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {/* Tap the place to put it on the map. A button rather than
                        a clickable card, so the "Maps" link can stay a sibling
                        instead of being nested inside another control. */}
                    <button
                      type="button"
                      onClick={() => showOnMap(place)}
                      disabled={!locatable}
                      aria-label={`Show ${place.name} on the map`}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-default"
                    >
                      <span
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          locatable ? "bg-primary/10" : "bg-elev-2"
                        }`}
                      >
                        <MapPin
                          className={`h-4 w-4 ${locatable ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </span>
                      <span className="flex-1 min-w-0">
                        <PlaceName
                          place={place}
                          tone="detail"
                          className="text-sm font-medium"
                        />
                        <span className="block text-xs text-muted-foreground truncate mt-0.5">
                          {place.address}
                        </span>
                        <MetroLine place={place} className="mt-1" />
                      </span>
                    </button>
                    {href && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs shrink-0 border-primary/20 text-primary hover:bg-primary/10"
                        asChild
                      >
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          <Navigation className="h-3 w-3 mr-1" />
                          Maps
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          {mode === "day" ? "Nothing pinned for this day" : "No places saved yet"}
        </p>
      )}
    </div>
  );
}
