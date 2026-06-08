import { MENU as STATIC_MENU } from "@/data/menu";
import { RESTAURANT as STATIC_RESTAURANT } from "@/data/restaurant";
import { STORY as STATIC_STORY } from "@/data/story";
import { Hero } from "@/components/Hero";
import { CategoryNav } from "@/components/CategoryNav";
import { FeaturedDishes } from "@/components/FeaturedDishes";
import { MenuList } from "@/components/MenuList";
import { Footer } from "@/components/Footer";
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
          {/* Full-bleed cinematic hero */}
          <Hero />
          {/* Constrained menu column */}
          <main className="relative z-10 mx-auto w-full max-w-3xl px-6">
            <CategoryNav />
            <FeaturedDishes />
            <MenuList />
            <Footer />
          </main>
        </TimeAwareMenuProvider>
      </ContentProvider>
    </>
  );
}
