import { MENU as STATIC_MENU } from "@/data/menu";
import { RESTAURANT as STATIC_RESTAURANT } from "@/data/restaurant";
import { applyIntros } from "@/data/category-intros";
import { enrichMenuWithDiet } from "@/lib/auto-diet";
import { getMenuFromDb, getRestaurantFromDb } from "@/lib/menu-from-db";
import { buildTvSlides, TV_PER_SLIDE_DEFAULT, type TvMatch } from "@/lib/tv-slides";
import { TvScreen } from "@/components/tv/TvScreen";
import { db } from "@/db";
import { footballEvents } from "@/db/schema";
import { and, asc, eq, gt } from "drizzle-orm";
import type { Locale, MenuCategory, RestaurantInfo } from "@/types/menu";
import "./tv.css";

// Same freshness as the guest menu; the screen also refreshes itself.
export const revalidate = 60;

export const metadata = {
  title: "Экран",
  description: "Меню на большом экране — слайд-шоу для зала",
  robots: { index: false, follow: false },
};

const DEFAULT_INTERVAL = 10;

type SearchParams = {
  lang?: string;
  interval?: string;
  theme?: string;
  per?: string;
  cats?: string;
  photos?: string;
};

function toLocale(v: string | undefined): Locale {
  return v === "uz" || v === "en" || v === "tr" ? v : "ru";
}

function toInt(v: string | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(v ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = toLocale(params.lang);
  const interval = toInt(params.interval, DEFAULT_INTERVAL, 4, 120);
  const perSlide = toInt(params.per, TV_PER_SLIDE_DEFAULT, 3, 14);
  const theme = params.theme === "dark" ? "dark" : "light";
  // Photo slides are opt-in (`?photos=1`) until the dish photography is good
  // enough for a wall-sized screen.
  const photos = params.photos === "1" || params.photos === "on";
  const categoryIds = (params.cats ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let menu: MenuCategory[] = applyIntros(enrichMenuWithDiet(STATIC_MENU));
  let restaurant: RestaurantInfo = STATIC_RESTAURANT;
  let matches: TvMatch[] = [];

  try {
    const [dbMenu, dbRestaurant, events] = await Promise.all([
      getMenuFromDb(),
      getRestaurantFromDb(),
      db
        .select()
        .from(footballEvents)
        .where(
          and(
            eq(footballEvents.isPublished, true),
            gt(footballEvents.startsAt, new Date())
          )
        )
        .orderBy(asc(footballEvents.startsAt))
        .limit(6),
    ]);

    if (dbMenu.length > 0) menu = enrichMenuWithDiet(dbMenu);
    if (dbRestaurant) restaurant = dbRestaurant;
    matches = events.map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      startsAt: m.startsAt.toISOString(),
      league: m.league,
      note: m.note,
    }));
  } catch (e) {
    console.error("TV screen: falling back to static menu:", e);
  }

  const slides = buildTvSlides(menu, { perSlide, categoryIds, photos, matches });

  return (
    <TvScreen
      slides={slides}
      restaurant={restaurant}
      locale={locale}
      intervalSec={interval}
      theme={theme}
    />
  );
}
