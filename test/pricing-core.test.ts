import { describe, it, expect } from "vitest";
import { priceLines, type DishPricing } from "@/lib/pricing-core";

const plov: DishPricing = {
  isPublished: true,
  inStock: true,
  validPrices: [45000],
};
// A dish with portion variants: only variant prices are valid.
const tea: DishPricing = {
  isPublished: true,
  inStock: true,
  validPrices: [12000, 18000],
};

function lookup(entries: Record<string, DishPricing>): Map<string, DishPricing> {
  return new Map(Object.entries(entries));
}

describe("priceLines — happy path math", () => {
  it("computes subtotal + 20% service, no birthday", () => {
    const r = priceLines(
      [{ id: "plov", qty: 2, price: 45000 }],
      lookup({ plov }),
      false
    );
    expect(r).toEqual({
      ok: true,
      subtotal: 90000,
      discount: 0,
      service: 18000, // 20% of 90000
      total: 108000,
    });
  });

  it("sums multiple lines and accepts a variant price", () => {
    const r = priceLines(
      [
        { id: "plov", qty: 1, price: 45000 },
        { id: "tea", qty: 3, price: 12000 },
      ],
      lookup({ plov, tea }),
      false
    );
    // subtotal 45000 + 36000 = 81000; service 16200; total 97200
    expect(r).toMatchObject({ ok: true, subtotal: 81000, service: 16200, total: 97200 });
  });
});

describe("priceLines — birthday discount", () => {
  it("applies −10% then 20% service on the discounted subtotal", () => {
    const r = priceLines(
      [{ id: "plov", qty: 2, price: 45000 }],
      lookup({ plov }),
      true
    );
    // subtotal 90000; discount 9000; service = 20% of 81000 = 16200;
    // total = 90000 − 9000 + 16200 = 97200
    expect(r).toEqual({
      ok: true,
      subtotal: 90000,
      discount: 9000,
      service: 16200,
      total: 97200,
    });
  });
});

describe("priceLines — rejections (anti-fraud)", () => {
  it("rejects a tampered (too-low) price", () => {
    const r = priceLines(
      [{ id: "plov", qty: 1, price: 1 }],
      lookup({ plov }),
      false
    );
    expect(r).toEqual({ ok: false, error: "Цена изменилась — обновите меню" });
  });

  it("rejects the base price when the dish only has variants", () => {
    // tea's base price is not in validPrices — sending it must fail.
    const r = priceLines(
      [{ id: "tea", qty: 1, price: 15000 }],
      lookup({ tea }),
      false
    );
    expect(r.ok).toBe(false);
  });

  it("rejects an unknown / removed dish", () => {
    const r = priceLines(
      [{ id: "ghost", qty: 1, price: 45000 }],
      lookup({ plov }),
      false
    );
    expect(r).toEqual({ ok: false, error: "Позиция недоступна" });
  });

  it("rejects an unpublished dish", () => {
    const r = priceLines(
      [{ id: "plov", qty: 1, price: 45000 }],
      lookup({ plov: { ...plov, isPublished: false } }),
      false
    );
    expect(r).toEqual({ ok: false, error: "Позиция недоступна" });
  });

  it("rejects an out-of-stock dish", () => {
    const r = priceLines(
      [{ id: "plov", qty: 1, price: 45000 }],
      lookup({ plov: { ...plov, inStock: false } }),
      false
    );
    expect(r).toEqual({ ok: false, error: "Блюдо закончилось" });
  });

  it("rejects a non-positive or non-integer quantity", () => {
    expect(priceLines([{ id: "plov", qty: 0, price: 45000 }], lookup({ plov }), false).ok).toBe(false);
    expect(priceLines([{ id: "plov", qty: -1, price: 45000 }], lookup({ plov }), false).ok).toBe(false);
    expect(priceLines([{ id: "plov", qty: 1.5, price: 45000 }], lookup({ plov }), false).ok).toBe(false);
  });

  it("rejects an empty cart", () => {
    expect(priceLines([], lookup({ plov }), false)).toEqual({
      ok: false,
      error: "Корзина пуста",
    });
  });
});
