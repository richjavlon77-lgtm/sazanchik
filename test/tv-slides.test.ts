import { describe, it, expect } from "vitest";
import { buildTvSlides, lowestPrice, hasVariants } from "@/lib/tv-slides";
import type { MenuCategory, MenuItem } from "@/types/menu";

const L = (ru: string) => ({ ru, uz: ru, en: ru });

function item(id: string, overrides: Partial<MenuItem> = {}): MenuItem {
  return { id, name: L(id), price: 40000, ...overrides };
}

function cat(id: string, items: MenuItem[]): MenuCategory {
  return { id, name: L(id), items };
}

describe("lowestPrice / hasVariants", () => {
  it("returns the plain price for a single-price dish", () => {
    expect(lowestPrice(35000)).toBe(35000);
    expect(hasVariants(35000)).toBe(false);
  });

  it("returns the cheapest portion for a dish with variants", () => {
    const price = [
      { label: L("большая"), price: 60000 },
      { label: L("малая"), price: 32000 },
    ];
    expect(lowestPrice(price)).toBe(32000);
    expect(hasVariants(price)).toBe(true);
  });
});

describe("buildTvSlides", () => {
  it("always opens with the brand slide", () => {
    const slides = buildTvSlides([]);
    expect(slides).toHaveLength(1);
    expect(slides[0].kind).toBe("brand");
  });

  it("splits a category into pages of `perSlide` items", () => {
    const items = Array.from({ length: 9 }, (_, i) => item(`d${i}`));
    const slides = buildTvSlides([cat("salads", items)], { perSlide: 4 });
    const lists = slides.filter((s) => s.kind === "list");

    expect(lists).toHaveLength(3);
    expect(lists.map((l) => l.items.length)).toEqual([4, 4, 1]);
    expect(lists.map((l) => l.part)).toEqual([1, 2, 3]);
    expect(lists.every((l) => l.parts === 3)).toBe(true);
  });

  it("skips stop-listed dishes and empty categories", () => {
    const slides = buildTvSlides([
      cat("soups", [item("a", { outOfStock: true }), item("b")]),
      cat("closed", [item("c", { outOfStock: true })]),
    ]);
    const lists = slides.filter((s) => s.kind === "list");

    expect(lists).toHaveLength(1);
    expect(lists[0].categoryId).toBe("soups");
    expect(lists[0].items.map((i) => i.id)).toEqual(["b"]);
  });

  it("shows no photo slides unless they are explicitly enabled", () => {
    const slides = buildTvSlides([
      cat("grill", [item("ribeye", { image: "/images/ribeye.jpg" })]),
    ]);
    expect(slides.some((s) => s.kind === "feature")).toBe(false);
  });

  it("adds a photo slide with the priciest dish that has an image", () => {
    const slides = buildTvSlides(
      [
        cat("grill", [
          item("cheap", { image: "/images/cheap.jpg", price: 50000 }),
          item("ribeye", { image: "/images/ribeye.jpg", price: 320000 }),
          item("nophoto", { price: 900000 }),
        ]),
      ],
      { photos: true }
    );
    const features = slides.filter((s) => s.kind === "feature");

    expect(features).toHaveLength(1);
    expect(features[0].item.id).toBe("ribeye");
    // the photo slide comes before that category's pages
    expect(slides.findIndex((s) => s.kind === "feature")).toBeLessThan(
      slides.findIndex((s) => s.kind === "list")
    );
  });

  it("omits the photo slide when no dish in the category has an image", () => {
    const slides = buildTvSlides([cat("tea", [item("a"), item("b")])], {
      photos: true,
    });
    expect(slides.some((s) => s.kind === "feature")).toBe(false);
  });

  it("keeps only the requested categories, numbered in menu order", () => {
    const slides = buildTvSlides(
      [cat("salads", [item("a")]), cat("soups", [item("b")]), cat("grill", [item("c")])],
      { categoryIds: ["soups", "grill"] }
    );
    const lists = slides.filter((s) => s.kind === "list");

    expect(lists.map((l) => l.categoryId)).toEqual(["soups", "grill"]);
    expect(lists.map((l) => l.number)).toEqual([1, 2]);
  });

  it("appends upcoming matches as the closing slide", () => {
    const slides = buildTvSlides([cat("salads", [item("a")])], {
      matches: [
        {
          id: "m1",
          homeTeam: "Пахтакор",
          awayTeam: "Бунёдкор",
          startsAt: "2026-08-20T19:00:00.000Z",
          league: "Суперлига",
          note: null,
        },
      ],
    });

    expect(slides.at(-1)?.kind).toBe("events");
  });

  it("clamps an absurd perSlide into a readable range", () => {
    const items = Array.from({ length: 40 }, (_, i) => item(`d${i}`));
    const lists = buildTvSlides([cat("all", items)], { perSlide: 999 }).filter(
      (s) => s.kind === "list"
    );
    expect(lists[0].items.length).toBe(14);
  });
});
