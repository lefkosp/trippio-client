import { useState } from "react";

/**
 * Runs `reset` during render whenever `key` changes.
 *
 * The alternative — an effect that seeds form state when a sheet opens — commits
 * the stale values first and re-renders immediately after, which is the cascading
 * render React warns about (react-hooks/set-state-in-effect). Adjusting during
 * render is the documented way to respond to a prop change.
 *
 * `key` is usually `open ? someId : null`, so the reset runs when the sheet opens
 * and again if it's reopened for a different subject, but not on unrelated
 * re-renders — which is what the effects it replaced were guarding.
 *
 * `reset` must only set state on the calling component.
 */
export function useResetOnChange(key: unknown, reset: () => void) {
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    reset();
  }
}
