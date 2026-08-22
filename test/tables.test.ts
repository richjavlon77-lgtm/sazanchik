import { describe, it, expect } from "vitest";
import {
  tableAlias,
  isVipTable,
  tableLabel,
  guestTableLabel,
  VIP_TABLE_NUMBERS,
} from "@/lib/tables";

describe("имена столов", () => {
  it("обычный стол остаётся номером", () => {
    expect(tableAlias("12")).toBeNull();
    expect(isVipTable("12")).toBe(false);
    expect(tableLabel("12")).toBe("Стол №12");
  });

  it("кабины получают собственные имена", () => {
    expect(tableLabel("33")).toBe("VIP 1");
    expect(tableLabel("34")).toBe("VIP 2");
    expect(tableLabel("35")).toBe("VIP 3");
    expect(isVipTable("35")).toBe(true);
  });

  it("принимает и число, и строку с пробелами", () => {
    expect(tableLabel(33)).toBe("VIP 1");
    expect(tableLabel(" 33 ")).toBe("VIP 1");
    expect(tableLabel(7)).toBe("Стол №7");
  });

  it("у гостя слово «стол» переводится, имя кабины — нет", () => {
    expect(guestTableLabel("12", "Stol")).toBe("Stol 12");
    expect(guestTableLabel("12", "Table")).toBe("Table 12");
    expect(guestTableLabel("33", "Stol")).toBe("VIP 1");
    expect(guestTableLabel("33", "Masa")).toBe("VIP 1");
  });

  it("список кабин идёт по возрастанию номера", () => {
    expect(VIP_TABLE_NUMBERS).toEqual(["33", "34", "35"]);
  });

  it("номера кабин не пересекаются с 32 столами зала", () => {
    for (let i = 1; i <= 32; i++) {
      expect(isVipTable(i)).toBe(false);
    }
  });
});
