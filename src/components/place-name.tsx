import { cn } from "@/lib/utils";
import type { Place } from "@/shared/types";

interface PlaceNameProps {
  place?: Place | null;
  /** Used when there's no place record — e.g. an event with only a title. */
  fallback?: string;
  /**
   * "list" keeps the Chinese line quiet and secondary, for dense rows.
   * "detail" gives it near-equal weight — that's the view you hold up to a
   * driver or a ticket desk, so the Chinese is the useful half.
   */
  tone?: "list" | "detail";
  className?: string;
}

/**
 * A place rendered as the bilingual pair it already is in the database.
 *
 * `nameZh` has been on the Place model since the China work but only ever
 * surfaced as a muted subtitle on the Places list. It's the single most useful
 * thing on the screen when you're standing in front of a taxi — so it renders
 * everywhere a place appears, and at "detail" tone it's set to be read aloud
 * from, not glanced at.
 */
export function PlaceName({
  place,
  fallback,
  tone = "list",
  className,
}: PlaceNameProps) {
  const latin = place?.name ?? fallback;
  const zh = place?.nameZh?.trim();

  if (!latin && !zh) return null;

  return (
    <span className={cn("flex flex-col min-w-0", className)}>
      {latin && <span className="truncate">{latin}</span>}
      {zh && (
        <span
          lang="zh-Hans"
          className={cn(
            "text-zh truncate",
            tone === "detail"
              ? "text-foreground/90 text-[0.95rem]"
              : "text-muted-foreground text-xs",
          )}
        >
          {zh}
        </span>
      )}
    </span>
  );
}
