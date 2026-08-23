import { useState } from "react";

// OpenStreetMap's tile CDN is unreliable from within mainland China without a
// VPN — this is a manual per-device toggle rather than auto-detection, since
// there's no reliable way to detect "blocked" (a slow/failed tile load looks
// the same as a flaky connection) and this only matters for the ~2 weeks of
// the actual trip.
//
// "dark" is Carto's dark basemap — OSM data, so it's blocked in mainland China
// exactly like `osm` is, and it exists for planning at home: bright OSM tiles
// inside a near-black app are jarring at any hour and blinding at night. Amap
// remains the one that actually works on the ground.
export type MapTileSource = "osm" | "dark" | "amap";

const STORAGE_KEY = "trippio:mapTileSource";

const VALID: MapTileSource[] = ["osm", "dark", "amap"];

function readStored(): MapTileSource {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as MapTileSource | null;
    return stored && VALID.includes(stored) ? stored : "dark";
  } catch {
    return "dark";
  }
}

export function useMapTileSource() {
  const [source, setSourceState] = useState<MapTileSource>(readStored);

  function setSource(next: MapTileSource) {
    setSourceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode, quota) — setting just won't
      // persist across reloads, not worth surfacing to the user.
    }
  }

  return [source, setSource] as const;
}
