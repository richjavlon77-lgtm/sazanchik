import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("transliterates Cyrillic to a URL-safe slug", () => {
    expect(slugify("Плов с говядиной")).toBe("plov-s-govyadinoy");
  });

  it("handles Uzbek-specific letters", () => {
    expect(slugify("Лағмон")).toBe("lagmon");
  });

  it("lowercases and collapses separators", () => {
    expect(slugify("  Hello   World!!  ")).toBe("hello-world");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--Plov--")).toBe("plov");
  });

  it("falls back to 'dish' for empty/symbol-only input", () => {
    expect(slugify("")).toBe("dish");
    expect(slugify("!!!")).toBe("dish");
  });

  it("caps length at 60 chars", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(60);
  });
});
