// A fixed, small palette assigned by first-appearance order within a trip's
// day list, so the (usually 2-4) cities on any one trip get visibly distinct
// colours. This used to be a hash of the city name, which seemed reasonable
// but broke on real data: with only 3 palette slots, a plain hash-mod-3 has
// no way to guarantee 3 arbitrary strings land in 3 different buckets, and
// in practice "Tokyo" / "Kyoto" / "Osaka" — the single most common case,
// three cities in one trip — all collided into the same colour. Assigning by
// visit order instead makes that case (anything up to 3 distinct cities)
// exact rather than probabilistic; only the 4th+ distinct city in a trip
// cycles back and repeats a colour, which is a real but much smaller and
// rarer limitation of a 3-colour palette.
//
// Widened from 3 slots to 6 (2026-08-23) because 3 wasn't enough for a real
// trip: China 2026 has four distinct cities — Larnaca / Travel, Beijing,
// Chongqing, Shanghai — so Shanghai wrapped around and rendered in Larnaca's
// colour. The six hues are spread across the wheel and reserve red for the
// seal accent, so no city badge can be mistaken for a primary action.
const PALETTE = [
  { bgClass: "bg-city-1", fgClass: "text-city-1-foreground" },
  { bgClass: "bg-city-2", fgClass: "text-city-2-foreground" },
  { bgClass: "bg-city-3", fgClass: "text-city-3-foreground" },
  { bgClass: "bg-city-4", fgClass: "text-city-4-foreground" },
  { bgClass: "bg-city-5", fgClass: "text-city-5-foreground" },
  { bgClass: "bg-city-6", fgClass: "text-city-6-foreground" },
] as const;

export type CityColorMap = Map<string, (typeof PALETTE)[number]>;

/** Build once per trip (e.g. from a sorted day list) and share across every
 * screen that renders a city badge, so the same city gets the same colour
 * everywhere rather than each screen re-deriving its own assignment. */
export function buildCityColorMap(citiesInOrder: (string | undefined | null)[]): CityColorMap {
  const map: CityColorMap = new Map();
  for (const city of citiesInOrder) {
    if (!city || map.has(city)) continue;
    map.set(city, PALETTE[map.size % PALETTE.length]);
  }
  return map;
}
