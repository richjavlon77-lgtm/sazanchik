import { describe, it, expect } from "vitest";
import {
  tableAlias,
  tableLabel,
  guestTableLabel,
  isVipTable,
  VIP_TABLE_NUMBERS,
} from "@/lib/tables";

describe("зонные имена столов (STREET 1–20 · HALL 1–12 · VIP 1–3)", () => {
  it("улица: 1–20 → STREET n", () => {
    expect(tableLabel(1)).toBe("STREET 1");
    expect(tableLabel("20")).toBe("STREET 20");
  });

  it("зал: 21–32 → HALL 1–12", () => {
    expect(tableLabel(21)).toBe("HALL 1");
    expect(tableLabel(32)).toBe("HALL 12");
  });

  it("кабины: 33–35 → VIP 1–3", () => {
    expect(tableLabel(33)).toBe("VIP 1");
    expect(tableLabel(35)).toBe("VIP 3");
    expect(isVipTable(34)).toBe(true);
    expect(isVipTable(20)).toBe(false);
  });

  it("номер вне разметки остаётся «Стол №N» (ручной ввод официанта)", () => {
    expect(tableLabel(99)).toBe("Стол №99");
    expect(tableAlias(99)).toBeNull();
  });

  it("принимает и число, и строку с пробелами", () => {
    expect(tableLabel(" 33 ")).toBe("VIP 1");
    expect(tableLabel("7")).toBe("STREET 7");
  });

  it("у гостя зонное имя одинаково на всех языках, вне разметки — слово из i18n", () => {
    expect(guestTableLabel(5, "Stol")).toBe("STREET 5");
    expect(guestTableLabel(99, "Stol")).toBe("Stol 99");
  });

  it("VIP-кнопки в композере — ровно три кабины", () => {
    expect(VIP_TABLE_NUMBERS).toEqual(["33", "34", "35"]);
  });
});
