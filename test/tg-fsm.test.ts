import { describe, it, expect } from "vitest";
import { bookingStep, parseDate, parseTime, type BookingData } from "@/lib/tg/booking-fsm";
import { deliveryStep, type DeliveryData } from "@/lib/tg/delivery-fsm";

const TODAY = "2026-08-23";

describe("parseDate", () => {
  it("сегодня/завтра", () => {
    expect(parseDate("Сегодня", TODAY)).toBe("2026-08-23");
    expect(parseDate("завтра", TODAY)).toBe("2026-08-24");
  });
  it("ДД.ММ этого года", () => {
    expect(parseDate("25.08", TODAY)).toBe("2026-08-25");
    expect(parseDate("31/12", TODAY)).toBe("2026-12-31");
  });
  it("прошедшая дата → следующий год", () => {
    expect(parseDate("01.01", TODAY)).toBe("2027-01-01");
  });
  it("мусор и несуществующие даты", () => {
    expect(parseDate("привет", TODAY)).toBeNull();
    expect(parseDate("31.02", TODAY)).toBeNull();
    expect(parseDate("40.10", TODAY)).toBeNull();
  });
});

describe("parseTime", () => {
  it("валидные", () => {
    expect(parseTime("19:30")).toBe("19:30");
    expect(parseTime("9.05")).toBe("09:05");
  });
  it("мусор", () => {
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("вечером")).toBeNull();
  });
});

describe("бронь: полный счастливый путь", () => {
  it("имя → контакт → завтра → кнопка времени → гости → подтверждение → done", () => {
    let state: string = "name";
    let data: BookingData = {};

    let r = bookingStep("name", data, { kind: "text", text: "Жавлон" }, TODAY);
    if ("cancelled" in r || r.done) throw new Error("early exit");
    ({ state, data } = r);
    expect(state).toBe("phone");

    r = bookingStep("phone", data, { kind: "contact", phone: "+998901234567" }, TODAY);
    if ("cancelled" in r || r.done) throw new Error("early exit");
    ({ state, data } = r);
    expect(state).toBe("date");

    r = bookingStep("date", data, { kind: "callback", data: "bk_d_tomorrow" }, TODAY);
    if ("cancelled" in r || r.done) throw new Error("early exit");
    ({ state, data } = r);
    expect(state).toBe("time");

    r = bookingStep("time", data, { kind: "callback", data: "bk_t_19:00" }, TODAY);
    if ("cancelled" in r || r.done) throw new Error("early exit");
    ({ state, data } = r);
    expect(state).toBe("guests");

    r = bookingStep("guests", data, { kind: "callback", data: "bk_g_4" }, TODAY);
    if ("cancelled" in r || r.done) throw new Error("early exit");
    ({ state, data } = r);
    expect(state).toBe("confirm");
    expect(r.reply.text).toContain("Жавлон");
    expect(r.reply.text).toContain("24.08.2026");

    const fin = bookingStep("confirm", data, { kind: "callback", data: "bk_ok" }, TODAY);
    if (!("done" in fin) || !fin.done) throw new Error("not done");
    expect(fin.booking).toEqual({
      name: "Жавлон",
      phone: "+998901234567",
      date: "2026-08-24",
      time: "19:00",
      guests: 4,
    });
  });

  it("отмена в любой момент", () => {
    const r = bookingStep("date", { name: "А", phone: "+998" }, { kind: "callback", data: "bk_cancel" }, TODAY);
    expect("cancelled" in r && r.cancelled).toBe(true);
  });

  it("кривой телефон не пропускается", () => {
    const r = bookingStep("phone", { name: "А" }, { kind: "text", text: "позвоните сами" }, TODAY);
    if ("cancelled" in r || r.done) throw new Error("early exit");
    expect(r.state).toBe("phone");
  });
});

describe("доставка: счастливый путь", () => {
  it("контакт → адрес → блюда → подтверждение → done", () => {
    let state: string = "phone";
    let data: DeliveryData = {};

    let r = deliveryStep("phone", data, { kind: "contact", phone: "+998901234567" });
    if ("cancelled" in r || r.done) throw new Error("early");
    ({ state, data } = r);
    expect(state).toBe("address");

    r = deliveryStep("address", data, { kind: "text", text: "Юнусабад, 12-34, подъезд 2" });
    if ("cancelled" in r || r.done) throw new Error("early");
    ({ state, data } = r);
    expect(state).toBe("items");

    r = deliveryStep("items", data, { kind: "text", text: "Плов ×2, ачичук" });
    if ("cancelled" in r || r.done) throw new Error("early");
    ({ state, data } = r);
    expect(state).toBe("confirm");

    const fin = deliveryStep("confirm", data, { kind: "callback", data: "dl_ok" });
    if (!("done" in fin) || !fin.done) throw new Error("not done");
    expect(fin.request.address).toContain("Юнусабад");
    expect(fin.request.items).toContain("Плов");
  });

  it("слишком короткий адрес переспрашивается", () => {
    const r = deliveryStep("address", { phone: "+998" }, { kind: "text", text: "дом" });
    if ("cancelled" in r || r.done) throw new Error("early");
    expect(r.state).toBe("address");
  });
});
