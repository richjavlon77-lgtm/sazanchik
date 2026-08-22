/**
 * Pure slide builder for the in-restaurant TV screen (`/tv`).
 * No React, no DB — just menu data → an ordered list of slides, so the
 * rotation logic is unit-testable.
 */
import type { Localized, MenuCategory, MenuItem, Price } from "@/types/menu";

export type TvMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  league: string | null;
  note: string | null;
};

export type TvSlide =
  | { kind: "brand"; id: string }
  | {
      /** Full-bleed photo slide — the "ad" beat between menu pages. */
      kind: "feature";
      id: string;
      categoryName: Localized;
      item: MenuItem;
    }
  | {
      kind: "list";
      id: string;
      categoryId: string;
      categoryName: Localized;
      intro?: Localized;
      /** 1-based category number, for the big watermark digit. */
      number: number;
      items: MenuItem[];
      part: number;
      parts: number;
    }
  | { kind: "events"; id: string; matches: TvMatch[] };

export type TvSlidesOptions = {
  /** Menu rows per list slide (readable from across the room). */
  perSlide?: number;
  /** Only these category slugs, in menu order. Empty = all. */
  categoryIds?: string[];
  /**
   * Full-screen dish photos. Off by default — the current photo set isn't good
   * enough for a big screen; turn it on once real shots are uploaded.
   */
  photos?: boolean;
  matches?: TvMatch[];
};

export const TV_PER_SLIDE_DEFAULT = 8;
const TV_PER_SLIDE_MIN = 3;
const TV_PER_SLIDE_MAX = 14;

/** Lowest price of a dish — variants collapse to their cheapest portion. */
export function lowestPrice(price: Price): number {
  if (Array.isArray(price)) {
    if (price.length === 0) return 0;
    return Math.min(...price.map((v) => v.price));
  }
  return price;
}

export function hasVariants(price: Price): boolean {
  return Array.isArray(price) && price.length > 1;
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Picks the dish that best carries a full-screen photo: has an image, and
 * among those the most expensive one (usually the signature dish).
 */
function pickFeatured(items: MenuItem[]): MenuItem | undefined {
  const withPhoto = items.filter((i) => i.image);
  if (withPhoto.length === 0) return undefined;
  return withPhoto.reduce((best, i) =>
    lowestPrice(i.price) > lowestPrice(best.price) ? i : best
  );
}

/**
 * Builds the loop: brand → (photo + pages) per category → upcoming matches.
 * Stop-listed dishes never reach the screen.
 */
export function buildTvSlides(
  menu: MenuCategory[],
  options: TvSlidesOptions = {}
): TvSlide[] {
  const perSlide = Math.min(
    TV_PER_SLIDE_MAX,
    Math.max(TV_PER_SLIDE_MIN, options.perSlide ?? TV_PER_SLIDE_DEFAULT)
  );
  const only = options.categoryIds?.length ? new Set(options.categoryIds) : null;

  const slides: TvSlide[] = [{ kind: "brand", id: "brand" }];
  let number = 0;

  for (const cat of menu) {
    if (only && !only.has(cat.id)) continue;
    const items = cat.items.filter((i) => !i.outOfStock);
    if (items.length === 0) continue;

    number += 1;

    const featured = options.photos ? pickFeatured(items) : undefined;
    if (featured) {
      slides.push({
        kind: "feature",
        id: `feature-${cat.id}-${featured.id}`,
        categoryName: cat.name,
        item: featured,
      });
    }

    const pages = chunk(items, perSlide);
    pages.forEach((page, i) => {
      slides.push({
        kind: "list",
        id: `list-${cat.id}-${i}`,
        categoryId: cat.id,
        categoryName: cat.name,
        intro: cat.intro,
        number,
        items: page,
        part: i + 1,
        parts: pages.length,
      });
    });
  }

  if (options.matches?.length) {
    slides.push({ kind: "events", id: "events", matches: options.matches });
  }

  return slides;
}
