// A fixed, small palette cycled by a hash of the city name, so any city gets
// a stable colour without a per-city lookup table. Previously this was a
// hardcoded Tokyo/Kyoto/Osaka map, which broke the moment a trip wasn't set
// in Japan — the colour tokens themselves (--city-tokyo etc.) are kept as
// the underlying CSS variables since they're already tuned for dark/light,
// just no longer named after the city that happens to land on them.
const PALETTE = [
  { bgClass: "bg-city-tokyo", fgClass: "text-city-tokyo-foreground" },
  { bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
  { bgClass: "bg-city-osaka", fgClass: "text-city-osaka-foreground" },
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function cityColor(city: string | undefined | null) {
  if (!city) return undefined;
  return PALETTE[hashString(city) % PALETTE.length];
}
