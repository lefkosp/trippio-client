import type { Place } from "@/shared/types";

// ─── WGS-84 → GCJ-02 ────────────────────────────────────────────────────────
// Mainland China legally mandates GCJ-02 ("Mars coordinates") for all local
// maps — a deliberate, non-linear obfuscation of true (WGS-84) coordinates,
// and Chinese law prohibits publishing the reverse conversion. Our geocoding
// (Nominatim) returns WGS-84, so anything handed to a China-domestic map
// provider needs this conversion first, or the pin lands 100-700m off in a
// way that looks plausible until you're standing on the wrong street.
//
// Ported from https://github.com/googollee/eviltransform (public domain) and
// checked against a known WGS-84/GCJ-02 reference pair (Beijing Railway
// Station) to within 1m before trusting it — an unverified port here is
// worse than no conversion at all, since the app would look correct while
// silently pointing at the wrong block.
//
// Apple Maps is deliberately NOT converted: MapKit (and the Maps app itself,
// same underlying engine) auto-applies the GCJ-02 offset for devices
// physically located in China, so feeding it already-shifted coordinates
// would double-correct.

const EARTH_RADIUS_M = 6378137.0;
const ECCENTRICITY_SQ = 0.006693421622965943;

function isOutsideChina(lat: number, lng: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transform(x: number, y: number): { lat: number; lng: number } {
  const xy = x * y;
  const absX = Math.sqrt(Math.abs(x));
  const xPi = x * Math.PI;
  const yPi = y * Math.PI;
  const d = 20.0 * Math.sin(6.0 * xPi) + 20.0 * Math.sin(2.0 * xPi);

  let lat = d;
  let lng = d;

  lat += 20.0 * Math.sin(yPi) + 40.0 * Math.sin(yPi / 3.0);
  lng += 20.0 * Math.sin(xPi) + 40.0 * Math.sin(xPi / 3.0);

  lat += 160.0 * Math.sin(yPi / 12.0) + 320.0 * Math.sin(yPi / 30.0);
  lng += 150.0 * Math.sin(xPi / 12.0) + 300.0 * Math.sin(xPi / 30.0);

  lat *= 2.0 / 3.0;
  lng *= 2.0 / 3.0;

  lat += -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * xy + 0.2 * absX;
  lng += 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * xy + 0.1 * absX;

  return { lat, lng };
}

function delta(lat: number, lng: number): { lat: number; lng: number } {
  const d = transform(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ECCENTRICITY_SQ * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  return {
    lat: (d.lat * 180.0) / (((EARTH_RADIUS_M * (1 - ECCENTRICITY_SQ)) / (magic * sqrtMagic)) * Math.PI),
    lng: (d.lng * 180.0) / ((EARTH_RADIUS_M / sqrtMagic) * Math.cos(radLat) * Math.PI),
  };
}

export function wgs84ToGcj02(lat: number, lng: number): { lat: number; lng: number } {
  if (isOutsideChina(lat, lng)) return { lat, lng };
  const d = delta(lat, lng);
  return { lat: lat + d.lat, lng: lng + d.lng };
}

// ─── Platform detection ─────────────────────────────────────────────────────

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  // Modern iPadOS reports as "MacIntel" but with touch support — the
  // standard sniff for telling it apart from a real Mac.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// ─── Link building ───────────────────────────────────────────────────────────
// Google Maps doesn't work in mainland China, so it's not a link target here
// at all. iOS gets Apple Maps (works in China, no conversion needed);
// Android and desktop get Amap (高德), the dominant China map app, which
// needs the GCJ-02 conversion above. Everywhere still falls back to an
// address-text search when coordinates aren't available yet (e.g. a place
// whose geocode lookup hasn't resolved, or found nothing), and finally to an
// explicitly pasted override link if someone set one.

export function mapLink(place: Place): string | null {
  const hasCoords = place.lat != null && place.lng != null;
  const name = encodeURIComponent(place.name);

  if (isIOS()) {
    if (hasCoords) {
      return `https://maps.apple.com/?ll=${place.lat},${place.lng}&q=${name}`;
    }
    if (place.address) {
      return `https://maps.apple.com/?q=${encodeURIComponent(place.address)}`;
    }
  } else {
    if (hasCoords) {
      const gcj = wgs84ToGcj02(place.lat!, place.lng!);
      // Amap takes lng,lat — reversed from the lat,lng convention used
      // everywhere else in this codebase (Leaflet, our own Place type).
      return `https://uri.amap.com/marker?position=${gcj.lng},${gcj.lat}&name=${name}`;
    }
    if (place.address) {
      return `https://uri.amap.com/search?keyword=${encodeURIComponent(place.address)}`;
    }
  }

  return place.googleMapsUrl || null;
}
