import { describe, it, expect } from "vitest";
import { pickStockFactor, type VariantFactor } from "@/lib/stock-factor";

const variants: VariantFactor[] = [
  { price: 35000, stockFactor: 0.7, sortOrder: 0 }, // малая
  { price: 50000, stockFactor: 1, sortOrder: 1 }, // большая
];

describe("pickStockFactor", () => {
  it("блюдо без вариантов → базовый рецепт (1)", () => {
    expect(pickStockFactor([], 35000)).toBe(1);
  });

  it("цена малой порции → её фактор", () => {
    expect(pickStockFactor(variants, 35000)).toBe(0.7);
  });

  it("цена большой порции → её фактор", () => {
    expect(pickStockFactor(variants, 50000)).toBe(1);
  });

  it("цена не совпала (легаси-снапшот, удалённый вариант) → безопасный 1", () => {
    expect(pickStockFactor(variants, 42000)).toBe(1);
  });

  it("цена не передана → 1", () => {
    expect(pickStockFactor(variants, undefined)).toBe(1);
  });

  it("дубль цены → детерминированно первый по sortOrder", () => {
    const dup: VariantFactor[] = [
      { price: 40000, stockFactor: 2, sortOrder: 5 },
      { price: 40000, stockFactor: 0.5, sortOrder: 1 },
    ];
    expect(pickStockFactor(dup, 40000)).toBe(0.5);
  });
});
