import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  callWaiterSchema,
  createReservationSchema,
} from "@/lib/validators";

const validLine = {
  id: "plov",
  qty: 2,
  price: 45000,
  name: { ru: "Плов", uz: "Osh", en: "Plov" },
};

describe("createOrderSchema", () => {
  it("accepts a minimal valid order (totals omitted)", () => {
    const r = createOrderSchema.safeParse({
      tableNumber: "5",
      lines: [validLine],
    });
    expect(r.success).toBe(true);
  });

  it("rejects an empty cart", () => {
    const r = createOrderSchema.safeParse({ tableNumber: "5", lines: [] });
    expect(r.success).toBe(false);
  });

  it("rejects a non-positive quantity", () => {
    const r = createOrderSchema.safeParse({
      tableNumber: "5",
      lines: [{ ...validLine, qty: 0 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a non-integer price", () => {
    const r = createOrderSchema.safeParse({
      tableNumber: "5",
      lines: [{ ...validLine, price: 4.5 }],
    });
    expect(r.success).toBe(false);
  });

  it("requires a table number", () => {
    const r = createOrderSchema.safeParse({ tableNumber: "", lines: [validLine] });
    expect(r.success).toBe(false);
  });

  it("caps tableToken length", () => {
    const r = createOrderSchema.safeParse({
      tableNumber: "5",
      tableToken: "x".repeat(65),
      lines: [validLine],
    });
    expect(r.success).toBe(false);
  });
});

describe("callWaiterSchema", () => {
  it("accepts known call types", () => {
    for (const type of ["waiter", "bill", "water"]) {
      expect(callWaiterSchema.safeParse({ tableNumber: "3", type }).success).toBe(true);
    }
  });

  it("rejects an unknown call type", () => {
    expect(callWaiterSchema.safeParse({ tableNumber: "3", type: "dance" }).success).toBe(false);
  });
});

describe("createReservationSchema", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);

  it("accepts a valid future reservation", () => {
    const r = createReservationSchema.safeParse({
      name: "Иван",
      phone: "+998901234567",
      guests: 4,
      reservedAt: future,
    });
    expect(r.success).toBe(true);
  });

  it("rejects a past reservation date", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString().slice(0, 16);
    const r = createReservationSchema.safeParse({
      name: "Иван",
      phone: "+998901234567",
      guests: 4,
      reservedAt: past,
    });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed phone", () => {
    const r = createReservationSchema.safeParse({
      name: "Иван",
      phone: "abc",
      guests: 4,
      reservedAt: future,
    });
    expect(r.success).toBe(false);
  });

  it("rejects guests out of range", () => {
    expect(
      createReservationSchema.safeParse({ name: "Иван", phone: "+998901234567", guests: 0, reservedAt: future }).success
    ).toBe(false);
    expect(
      createReservationSchema.safeParse({ name: "Иван", phone: "+998901234567", guests: 99, reservedAt: future }).success
    ).toBe(false);
  });
});
