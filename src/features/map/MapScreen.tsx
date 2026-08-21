import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDays, useEventsWithPlaces, usePlaces } from "@/shared/hooks/queries";
import { useTripContext } from "@/shared/context/useTripContext";
import { mapLink, wgs84ToGcj02 } from "@/lib/mapLink";
import { useMapTileSource, type MapTileSource } from "@/lib/mapTileSource";
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

// Vite bundles these image imports to hashed URLs; Leaflet's default icon
// otherwise references package-relative paths that don't resolve — the
// classic broken-marker-icon problem with any bundler.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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
                ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_rgba(45,212,191,0.15)]"
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

function LeafletMap({ places, tileSource }: { places: Place[]; tileSource: MapTileSource }) {
  const withCoords = places.filter((p) => p.lat && p.lng);
  // Default center: Beijing — arbitrary, only used before any marker exists.
  const fallbackCenter: [number, number] = [39.9042, 116.4074];
  const tile = TILE_CONFIG[tileSource];

  return (
    <div className="rounded-xl overflow-hidden border border-border h-72">
      <MapContainer
        center={withCoords[0] ? [withCoords[0].lat!, withCoords[0].lng!] : fallbackCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          key={tileSource}
          attribution={tile.attribution}
          url={tile.url}
          subdomains={tile.subdomains}
        />
        <FitBounds places={withCoords} />
        {withCoords.map((place) => (
          <Marker key={place._id} position={[place.lat!, place.lng!]}>
            <Popup>
              <span className="font-medium">{place.name}</span>
              {place.nameZh && <><br />{place.nameZh}</>}
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

  const places = mode === "day" ? dayPlaces : (allPlaces ?? []);
  const placesLoading = mode === "day" ? dayEventsLoading : allPlacesLoading;
  const placesWithCoords = places.filter((p) => p.lat && p.lng);
  const placesMissingCoords = places.filter((p) => !p.lat || !p.lng);

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
      {/* Header + mode toggle */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-page-title">Map</h1>
        <div className="flex items-center gap-1 rounded-full bg-elev-2 p-0.5 shrink-0">
          {(["day", "all"] as MapMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all press-scale ${
                mode === m
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {m === "day" ? "This day" : "All places"}
            </button>
          ))}
        </div>
      </div>

      {/* Day selector — only relevant in "this day" mode */}
      {mode === "day" && days && (
        <DaySelector
          days={days}
          selectedDayId={effectiveDayId}
          onSelect={setSelectedDayId}
        />
      )}

      {/* Tile source — OSM works everywhere except mainland China; switch to
          Amap once you're actually there. */}
      <div className="flex items-center gap-1 rounded-full bg-elev-2 p-0.5 w-fit -mt-1">
        {(["osm", "amap"] as MapTileSource[]).map((s) => (
          <button
            key={s}
            onClick={() => setTileSource(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all press-scale ${
              tileSource === s
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground"
            }`}
          >
            {s === "osm" ? "OpenStreetMap" : "Amap (China)"}
          </button>
        ))}
      </div>

      {/* Map */}
      {placesLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <LeafletMap places={mapDisplayPlaces} tileSource={tileSource} />
      )}
      {placesMissingCoords.length > 0 && (
        <p className="text-xs text-muted-foreground/70 -mt-4">
          {placesMissingCoords.length} place{placesMissingCoords.length !== 1 ? "s" : ""} without
          coordinates yet — they'll appear once geocoding resolves.
        </p>
      )}

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
          <div className="space-y-2">
            {places.map((place) => {
              const href = mapLink(place);
              return (
                <Card key={place._id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{place.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {place.address}
                      </p>
                    </div>
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
          {mode === "day" ? "No places for this day" : "No places saved yet"}
        </p>
      )}
    </div>
  );
}
