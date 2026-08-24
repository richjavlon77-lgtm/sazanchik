import { MENU as STATIC_MENU } from "@/data/menu";
import { RESTAURANT as STATIC_RESTAURANT } from "@/data/restaurant";
import { STORY as STATIC_STORY } from "@/data/story";
import { Hero } from "@/components/Hero";
import { CategoryNav } from "@/components/CategoryNav";
import { FeaturedDishes } from "@/components/FeaturedDishes";
import { FootballBanner, type MatchItem } from "@/components/FootballBanner";
import { MenuList } from "@/components/MenuList";
import { db } from "@/db";
import { footballEvents } from "@/db/schema";
import { and, eq, gt, asc } from "drizzle-orm";
import { Footer } from "@/components/Footer";
import { ReviewsSection } from "@/components/ReviewsSection";
import { DishRatingsProvider } from "@/components/DishRating";
import { OrnamentBackground } from "@/components/Ornament";
import { TimeAwareMenuProvider } from "@/components/TimeAwareMenuProvider";
import { ContentProvider } from "@/lib/content-context";
import { enrichMenuWithDiet } from "@/lib/auto-diet";
import { applyIntros } from "@/data/category-intros";
import { JsonLd } from "@/components/JsonLd";
import { buildRestaurantSchema, buildBreadcrumbSchema } from "@/lib/schema";
import {
  getMenuFromDb,
  getRestaurantFromDb,
  getStoryFromDb,
} from "@/lib/menu-from-db";

// Revalidate every 60 seconds (and on-demand from admin via revalidatePath)
export const revalidate = 60;

export default async function Home() {
  let menu;
  let restaurant = STATIC_RESTAURANT;
  let story = STATIC_STORY;
  let matches: MatchItem[] = [];

  try {
    const [dbMenu, dbRestaurant, dbStory] = await Promise.all([
      getMenuFromDb(),
      getRestaurantFromDb(),
      getStoryFromDb(),
    ]);

    menu =
      dbMenu.length > 0
        ? enrichMenuWithDiet(dbMenu)
        : applyIntros(enrichMenuWithDiet(STATIC_MENU));
    if (dbRestaurant) restaurant = dbRestaurant;
    if (dbStory.length > 0) story = dbStory;
    matches = (
      await db
        .select()
        .from(footballEvents)
        .where(
          and(
            eq(footballEvents.isPublished, true),
            gt(footballEvents.startsAt, new Date())
          )
        )
        .orderBy(asc(footballEvents.startsAt))
        .limit(6)
    ).map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      startsAt: m.startsAt.toISOString(),
      league: m.league,
      note: m.note,
    }));
  } catch (e) {
    console.error("Falling back to static content:", e);
    menu = applyIntros(enrichMenuWithDiet(STATIC_MENU));
  }

  return (
    <>
      <JsonLd data={buildRestaurantSchema(menu)} />
      <JsonLd data={buildBreadcrumbSchema()} />
      <OrnamentBackground />
      <ContentProvider value={{ restaurant, story }}>
        <TimeAwareMenuProvider menu={menu}>
          {/* Flat light guest header */}
          <Hero />
          {/* Constrained menu column */}
          <main className="relative z-10 mx-auto w-full max-w-3xl px-6">
            <CategoryNav />
            <FootballBanner matches={matches} />
            <FeaturedDishes />
            <DishRatingsProvider>
              <MenuList />
            </DishRatingsProvider>
            <ReviewsSection />
            <Footer />
          </main>
        </TimeAwareMenuProvider>
      </ContentProvider>
    </>
  );
}
