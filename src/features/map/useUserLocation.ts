import { useCallback, useEffect, useRef, useState } from "react";

export interface UserPosition {
  lat: number;
  lng: number;
  /** Metres. The browser's own estimate — drawn as a circle on the map. */
  accuracy: number;
}

type Status = "idle" | "locating" | "tracking" | "error";

function messageFor(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location is blocked. Turn it back on in your browser's site settings.";
    case err.POSITION_UNAVAILABLE:
      return "Couldn't get a fix. Try again once you're outside or on better signal.";
    case err.TIMEOUT:
      return "Took too long to find you. Try again.";
    default:
      return "Couldn't get your location.";
  }
}

/**
 * Where you are, while you're on the ground.
 *
 * Deliberately opt-in and never started on mount: an unprompted permission
 * dialog the first time you open the Map tab is hostile, and this is only
 * useful once you're actually walking around. `watchPosition` rather than a
 * one-shot read, so the dot keeps up while you move — cleared as soon as you
 * turn it off or leave the screen, since an open watch keeps the GPS warm and
 * eats battery.
 */
export function useUserLocation() {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setStatus("idle");
    setPosition(null);
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("This browser can't share your location.");
      return;
    }
    setStatus("locating");
    setError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("tracking");
      },
      (err) => {
        // A watch can fail repeatedly; stop rather than leave it retrying
        // against a permission the user has already refused.
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
        setStatus("error");
        setError(messageFor(err));
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
  }, []);

  const toggle = useCallback(() => {
    if (status === "idle" || status === "error") start();
    else stop();
  }, [status, start, stop]);

  // Never leave a watch running behind a screen you've navigated away from.
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []);

  return { position, status, error, toggle, stop };
}
