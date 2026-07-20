import { describe, it, expect } from "vitest";
import {
  t,
  formatPrice,
  LOCALES,
  DEFAULT_LOCALE,
  UI_STRINGS,
} from "@/lib/i18n-core";

describe("t() — localized value lookup", () => {
  it("returns value for an existing locale", () => {
    const val = { ru: "Плов", uz: "Palov", en: "Plov" };
    expect(t(val, "ru")).toBe("Плов");
    expect(t(val, "uz")).toBe("Palov");
    expect(t(val, "en")).toBe("Plov");
  });

  it("falls back to default locale (ru) when target is missing", () => {
    const val = { ru: "Плов", uz: "Palov", en: "Plov" };
    expect(t(val, "tr")).toBe("Плов");
  });

  it("returns empty string when default locale is also empty", () => {
    const val = { ru: "", uz: "", en: "" };
    expect(t(val, "tr")).toBe("");
  });

  it("prefers Turkish when explicitly provided", () => {
    const val = { ru: "Плов", uz: "Palov", en: "Plov", tr: "Pilav" };
    expect(t(val, "tr")).toBe("Pilav");
  });

  it("returns default locale (ru) even if locale key is present but empty", () => {
    const val = { ru: "Плов", uz: "", en: "" };
    expect(t(val, "uz")).toBe("Плов");
  });
});

describe("formatPrice()", () => {
  it("formats with Russian locale and сум suffix", () => {
    const result = formatPrice(45000, "ru");
    expect(result).toMatch(/45\u00A0000 сум/);
  });

  it("formats with English locale (comma separator)", () => {
    expect(formatPrice(15000, "en")).toBe("15,000 UZS");
  });

  it("formats with Uzbek locale (non-breaking space)", () => {
    const result = formatPrice(10000, "uz");
    expect(result).toMatch(/10\u00A0000 so'm/);
  });

  it("formats with Turkish locale (dot separator)", () => {
    expect(formatPrice(5000, "tr")).toBe("5.000 som");
  });

  it("formats zero", () => {
    const result = formatPrice(0, "ru");
    expect(result).toMatch(/0 сум/);
  });

  it("formats large numbers with non-breaking space separators", () => {
    const result = formatPrice(1000000, "ru");
    expect(result).toMatch(/1\u00A0000\u00A0000 сум/);
  });
});

describe("LOCALES", () => {
  it("has all 4 languages", () => {
    expect(LOCALES).toHaveLength(4);
  });

  it("includes ru, uz, en, tr", () => {
    const codes = LOCALES.map((l) => l.code);
    expect(codes).toContain("ru");
    expect(codes).toContain("uz");
    expect(codes).toContain("en");
    expect(codes).toContain("tr");
  });
});

describe("DEFAULT_LOCALE", () => {
  it("is Russian", () => {
    expect(DEFAULT_LOCALE).toBe("ru");
  });
});

describe("UI_STRINGS", () => {
  it("contains all required UI strings", () => {
    const required = [
      "menu",
      "cart_title",
      "cart_total",
      "cart_empty",
      "search_placeholder",
      "search_no_results",
      "call_waiter",
      "currency",
    ];
    for (const key of required) {
      expect(UI_STRINGS[key]).toBeDefined();
      expect(UI_STRINGS[key].ru).toBeTruthy();
    }
  });

  it("every string has ru, uz, en, and optionally tr", () => {
    for (const [key, val] of Object.entries(UI_STRINGS)) {
      expect(val.ru, `${key}.ru`).toBeTruthy();
      expect(val.uz, `${key}.uz`).toBeTruthy();
      expect(val.en, `${key}.en`).toBeTruthy();
      // tr is optional, but if present must be non-empty
      if ("tr" in val && val.tr !== undefined) {
        expect(val.tr, `${key}.tr`).toBeTruthy();
      }
    }
  });
});
