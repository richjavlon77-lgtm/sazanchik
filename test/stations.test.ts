import { describe, it, expect } from "vitest";
import {
  STATIONS,
  STATION_READY_COLUMN,
  stationForCategory,
  itemStation,
} from "@/lib/stations";

describe("STATIONS config", () => {
  it("has all 5 stations", () => {
    const keys = Object.keys(STATIONS);
    expect(keys).toHaveLength(5);
    expect(keys.sort()).toEqual(["bar", "cold", "hookah", "kitchen", "meat"]);
  });

  it("each station has all required fields", () => {
    for (const [key, cfg] of Object.entries(STATIONS)) {
      expect(cfg.role, `${key}.role`).toBeTruthy();
      expect(cfg.title, `${key}.title`).toBeTruthy();
      expect(cfg.icon, `${key}.icon`).toBeTruthy();
      expect(cfg.loginPath, `${key}.loginPath`).toMatch(/^\//);
      expect(cfg.homePath, `${key}.homePath`).toMatch(/^\//);
      expect(cfg.readyLabel, `${key}.readyLabel`).toBeTruthy();
      expect(cfg.readyToast, `${key}.readyToast`).toBeTruthy();
      expect(cfg.emptyText, `${key}.emptyText`).toBeTruthy();
    }
  });

  it("role matches the expected pattern (bartender/hookah/cold/meat/cook)", () => {
    expect(STATIONS.bar.role).toBe("bartender");
    expect(STATIONS.hookah.role).toBe("hookah");
    expect(STATIONS.cold.role).toBe("cold");
    expect(STATIONS.meat.role).toBe("meat");
    expect(STATIONS.kitchen.role).toBe("cook");
  });

  it("homePath matches station key", () => {
    for (const [key, cfg] of Object.entries(STATIONS)) {
      expect(cfg.homePath).toBe(`/${key}`);
    }
  });

  it("loginPath matches station key", () => {
    for (const [key, cfg] of Object.entries(STATIONS)) {
      expect(cfg.loginPath).toBe(`/${key}/login`);
    }
  });
});

describe("STATION_READY_COLUMN", () => {
  it("has all 5 stations mapped", () => {
    expect(Object.keys(STATION_READY_COLUMN)).toHaveLength(5);
  });

  it("maps to correct column names", () => {
    expect(STATION_READY_COLUMN.bar).toBe("drinksReady");
    expect(STATION_READY_COLUMN.hookah).toBe("hookahReady");
    expect(STATION_READY_COLUMN.cold).toBe("coldReady");
    expect(STATION_READY_COLUMN.meat).toBe("meatReady");
    expect(STATION_READY_COLUMN.kitchen).toBe("foodReady");
  });
});

describe("stationForCategory()", () => {
  it("maps drinks to bar", () => {
    expect(stationForCategory("coffee")).toBe("bar");
    expect(stationForCategory("tea")).toBe("bar");
    expect(stationForCategory("fresh-drinks")).toBe("bar");
    expect(stationForCategory("cold-drinks")).toBe("bar");
  });

  it("maps hookah to hookah", () => {
    expect(stationForCategory("hookah")).toBe("hookah");
  });

  it("maps cold-starters and salads to cold", () => {
    expect(stationForCategory("cold-starters")).toBe("cold");
    expect(stationForCategory("salads")).toBe("cold");
  });

  it("maps hot proteins to meat", () => {
    expect(stationForCategory("hot-starters")).toBe("meat");
    expect(stationForCategory("caucasian-grill")).toBe("meat");
    expect(stationForCategory("steaks")).toBe("meat");
    expect(stationForCategory("fish")).toBe("meat");
    expect(stationForCategory("hot-mains")).toBe("meat");
  });

  it("falls back to kitchen for unknown categories", () => {
    expect(stationForCategory("soups")).toBe("kitchen");
    expect(stationForCategory("sides")).toBe("kitchen");
    expect(stationForCategory("bread")).toBe("kitchen");
    expect(stationForCategory("desserts")).toBe("kitchen");
    expect(stationForCategory("nonexistent")).toBe("kitchen");
    expect(stationForCategory("")).toBe("kitchen");
  });
});

describe("itemStation()", () => {
  it("uses explicit station tag when present", () => {
    expect(itemStation({ station: "bar" })).toBe("bar");
    expect(itemStation({ station: "meat" })).toBe("meat");
    expect(itemStation({ station: "kitchen" })).toBe("kitchen");
    expect(itemStation({ station: "cold" })).toBe("cold");
    expect(itemStation({ station: "hookah" })).toBe("hookah");
  });

  it("falls back to isDrink → bar", () => {
    expect(itemStation({ isDrink: true })).toBe("bar");
  });

  it("falls back to isHookah → hookah", () => {
    expect(itemStation({ isHookah: true })).toBe("hookah");
  });

  it("explicit station tag beats fallback flags", () => {
    expect(
      itemStation({ station: "kitchen", isDrink: true })
    ).toBe("kitchen");
    expect(
      itemStation({ station: "cold", isHookah: true })
    ).toBe("cold");
  });

  it("defaults to kitchen when nothing matches", () => {
    expect(itemStation({})).toBe("kitchen");
    expect(itemStation({ isDrink: false, isHookah: false })).toBe("kitchen");
  });
});
