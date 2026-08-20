import { useState } from "react";

// OpenStreetMap's tile CDN is unreliable from within mainland China without a
// VPN — this is a manual per-device toggle rather than auto-detection, since
// there's no reliable way to detect "blocked" (a slow/failed tile load looks
// the same as a flaky connection) and this only matters for the ~2 weeks of
// the actual trip.
export type MapTileSource = "osm" | "amap";

const STORAGE_KEY = "trippio:mapTileSource";

function readStored(): MapTileSource {
  try {
    return localStorage.getItem(STORAGE_KEY) === "amap" ? "amap" : "osm";
  } catch {
    return "osm";
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
