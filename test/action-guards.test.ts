import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionPayload } from "@/lib/auth";

/**
 * These tests assert the AUTHORIZATION property of the mutating server actions:
 * an unauthenticated or wrong-role caller is rejected *before* any DB work. The
 * guard runs first, so a trivial `db` stub is enough — we never reach it. The
 * happy path (a manager actually mutating rows) needs a real/seeded test DB and
 * is intentionally out of scope here.
 */

// vi.mock is hoisted above module-level consts, so the mock fn must be created
// inside vi.hoisted (which runs first) to be referenceable in the factory.
const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<SessionPayload | null>>(),
}));

vi.mock("@/lib/session", () => ({ getSession }));
vi.mock("@/db", () => ({ db: {}, schema: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import * as finance from "@/lib/finance-actions";
import * as inventory from "@/lib/inventory-actions";
import * as payroll from "@/lib/payroll-actions";
import * as recipe from "@/lib/recipe-actions";
import * as shifts from "@/lib/shifts-actions";
import * as station from "@/lib/station-actions";
import * as cook from "@/lib/cook-actions";

// Each entry: a manager-guarded action invoked with throwaway-but-typed args.
const managerActions: [string, () => Promise<unknown>][] = [
  ["finance.addExpense", () => finance.addExpense({ amount: 1000, category: "other" })],
  ["finance.deleteExpense", () => finance.deleteExpense("e1")],
  ["inventory.deleteIngredient", () => inventory.deleteIngredient("i1")],
  ["payroll.deleteEmployee", () => payroll.deleteEmployee("p1")],
  ["payroll.setEmployeeActive", () => payroll.setEmployeeActive("p1", false)],
  ["recipe.removeRecipeItem", () => recipe.removeRecipeItem("d1", "i1")],
  ["shifts.deleteShift", () => shifts.deleteShift("s1")],
  ["shifts.clockIn", () => shifts.clockIn("emp1")],
];

const manager: SessionPayload = { role: "manager" };
const waiter: SessionPayload = { role: "waiter", waiterId: "w1", name: "Али" };

beforeEach(() => {
  getSession.mockReset();
});

describe("manager-guarded actions reject unauthorized callers", () => {
  for (const [name, call] of managerActions) {
    it(`${name} rejects with no session`, async () => {
      getSession.mockResolvedValue(null);
      await expect(call()).rejects.toThrow(/Unauthorized/);
    });

    it(`${name} rejects a non-manager (waiter) session`, async () => {
      getSession.mockResolvedValue(waiter);
      await expect(call()).rejects.toThrow(/Unauthorized/);
    });
  }
});

describe("role-scoped actions reject the wrong role", () => {
  it("station.markStationReady rejects a non-owner role", async () => {
    getSession.mockResolvedValue(null);
    await expect(station.markStationReady("o1", "bar")).rejects.toThrow(/Unauthorized/);
    // a waiter is not the bar's owner role → still rejected
    getSession.mockResolvedValue(waiter);
    await expect(station.markStationReady("o1", "bar")).rejects.toThrow(/Unauthorized/);
  });

  it("cook.setDishStock rejects a non-cook session", async () => {
    getSession.mockResolvedValue(null);
    await expect(cook.setDishStock("d1", false)).rejects.toThrow(/Unauthorized/);
    getSession.mockResolvedValue(waiter);
    await expect(cook.setDishStock("d1", false)).rejects.toThrow(/Unauthorized/);
  });

  it("station.toggleItemReady rejects an unauthenticated caller", async () => {
    // No session is rejected before any DB read (the role-vs-station check
    // happens after loading the dish and needs a seeded DB — out of scope).
    getSession.mockResolvedValue(null);
    await expect(station.toggleItemReady("o1", 0, true)).rejects.toThrow(/Unauthorized/);
  });
});

describe("guard accepts the right role (reaches past the check)", () => {
  // With a manager session the guard passes, so the action proceeds to the DB
  // stub and fails there — NOT with "Unauthorized". That difference proves the
  // guard let an authorized caller through.
  it("manager passes finance.deleteExpense's guard", async () => {
    getSession.mockResolvedValue(manager);
    await expect(finance.deleteExpense("e1")).rejects.not.toThrow(/Unauthorized/);
  });
});
