import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import {
  toTiyin,
  fromTiyin,
  paymeCheckAuth,
  paymeStateOf,
  PaymeState,
  buildPaymeCheckoutUrl,
  clickSignature,
  clickCheckSign,
  buildClickPayUrl,
  type ClickRequest,
} from "@/lib/payments/core";

describe("суммы: сумы ↔ тийины", () => {
  it("конвертирует туда и обратно без потерь", () => {
    expect(toTiyin(150000)).toBe(15000000);
    expect(fromTiyin(15000000)).toBe(150000);
    expect(fromTiyin(toTiyin(48500))).toBe(48500);
  });
});

describe("paymeCheckAuth", () => {
  const KEY = "secret-merchant-key";
  const header = "Basic " + Buffer.from(`Paycom:${KEY}`).toString("base64");

  it("пускает валидный Basic-заголовок", () => {
    expect(paymeCheckAuth(header, KEY)).toBe(true);
  });

  it("режет неверный ключ, мусор и отсутствие заголовка", () => {
    const bad = "Basic " + Buffer.from("Paycom:wrong").toString("base64");
    expect(paymeCheckAuth(bad, KEY)).toBe(false);
    expect(paymeCheckAuth("Bearer xyz", KEY)).toBe(false);
    expect(paymeCheckAuth(null, KEY)).toBe(false);
    expect(paymeCheckAuth(header, "")).toBe(false);
  });
});

describe("paymeStateOf", () => {
  it("отражает жизненный цикл в коды протокола", () => {
    expect(paymeStateOf({ state: "created", paidBeforeCancel: false })).toBe(PaymeState.Created);
    expect(paymeStateOf({ state: "paid", paidBeforeCancel: false })).toBe(PaymeState.Performed);
    expect(paymeStateOf({ state: "cancelled", paidBeforeCancel: false })).toBe(
      PaymeState.CancelledFromCreated
    );
    expect(paymeStateOf({ state: "cancelled", paidBeforeCancel: true })).toBe(
      PaymeState.CancelledAfterPerform
    );
  });
});

describe("ссылки на оплату", () => {
  it("payme: base64 с тийинами", () => {
    const url = buildPaymeCheckoutUrl("MID", "session-1", 150000);
    const decoded = Buffer.from(url.split("/").pop()!, "base64").toString();
    expect(decoded).toBe("m=MID;ac.bill_id=session-1;a=15000000");
  });

  it("click: сумма в сумах, transaction_param = счёт", () => {
    const url = buildClickPayUrl("111", "222", "session-1", 150000);
    expect(url).toContain("service_id=111");
    expect(url).toContain("amount=150000");
    expect(url).toContain("transaction_param=session-1");
  });
});

describe("подпись Click", () => {
  const SECRET = "click-secret";
  const base: Omit<ClickRequest, "sign_string"> = {
    click_trans_id: "12345",
    service_id: "999",
    merchant_trans_id: "sess-1",
    amount: "150000",
    action: "0",
    sign_time: "2026-08-23 12:00:00",
  };

  it("prepare: совпадает с эталонным md5", () => {
    const raw = "12345" + "999" + SECRET + "sess-1" + "150000" + "0" + "2026-08-23 12:00:00";
    expect(clickSignature(base, SECRET)).toBe(createHash("md5").update(raw).digest("hex"));
  });

  it("complete: в подпись входит merchant_prepare_id", () => {
    const req = { ...base, action: "1", merchant_prepare_id: "prep-7" };
    const raw =
      "12345" + "999" + SECRET + "sess-1" + "prep-7" + "150000" + "1" + "2026-08-23 12:00:00";
    expect(clickSignature(req, SECRET)).toBe(createHash("md5").update(raw).digest("hex"));
  });

  it("clickCheckSign: валидная проходит, подделка нет", () => {
    const sign = clickSignature(base, SECRET);
    expect(clickCheckSign({ ...base, sign_string: sign }, SECRET)).toBe(true);
    expect(clickCheckSign({ ...base, sign_string: sign.toUpperCase() }, SECRET)).toBe(true);
    expect(
      clickCheckSign({ ...base, amount: "1", sign_string: sign }, SECRET)
    ).toBe(false);
    expect(clickCheckSign({ ...base, sign_string: "deadbeef" }, SECRET)).toBe(false);
  });
});
