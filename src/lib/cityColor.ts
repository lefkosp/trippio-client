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
const PALETTE = [
  { bgClass: "bg-city-tokyo", fgClass: "text-city-tokyo-foreground" },
  { bgClass: "bg-city-kyoto", fgClass: "text-city-kyoto-foreground" },
  { bgClass: "bg-city-osaka", fgClass: "text-city-osaka-foreground" },
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
