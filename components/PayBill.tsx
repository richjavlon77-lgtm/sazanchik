"use client";

import { useEffect, useState } from "react";
import { useTableNumber } from "@/lib/table";
import { useLocale } from "@/lib/i18n";

type BillInfo = {
  enabled: boolean;
  demo?: boolean;
  open?: boolean;
  total?: number;
  paidOnline?: number;
  due?: number;
  paymeUrl?: string | null;
  clickUrl?: string | null;
};

const T = {
  bill: { ru: "Ваш счёт", uz: "Hisobingiz", en: "Your bill", tr: "Hesabınız" },
  payOnline: {
    ru: "Оплатить онлайн",
    uz: "Onlayn to'lash",
    en: "Pay online",
    tr: "Online öde",
  },
  paid: {
    ru: "Оплачено онлайн",
    uz: "Onlayn to'landi",
    en: "Paid online",
    tr: "Online ödendi",
  },
} as const;

/**
 * Гостевая оплата счёта со стола (Payme/Click). Рендерится только когда:
 * провайдеры включены (env-ключи мерчанта) И гость пришёл по подписанному
 * QR И по столу есть открытый счёт. До подключения мерчанта — невидим.
 */
export function PayBill({ className }: { className?: string }) {
  const { tableToken } = useTableNumber();
  const { locale } = useLocale();
  const [bill, setBill] = useState<BillInfo | null>(null);

  useEffect(() => {
    if (!tableToken) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/bill?t=${encodeURIComponent(tableToken)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as BillInfo;
        if (!cancelled) setBill(data);
      } catch {
        /* сеть — молча, блок просто не покажется */
      }
    };
    load();
    // Счёт растёт с дозаказами и закрывается оплатой — освежаем нечасто
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tableToken]);

  if (!bill?.enabled || !bill.open || !bill.total) return null;

  const t = (k: keyof typeof T) => T[k][locale] ?? T[k].ru;
  const fmt = (n: number) => n.toLocaleString("ru-RU");

  return (
    <div className={className}>
      <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("bill")}
          </span>
          <span className="font-heading text-lg tabular-nums text-gold">
            {fmt(bill.due && bill.due > 0 ? bill.due : bill.total)} UZS
          </span>
        </div>

        {bill.due === 0 ? (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-500">
            ✓ {t("paid")}
          </div>
        ) : bill.demo ? (
          /* Демо-витрина: кнопки ведут на демо-чекаут — воронка доигрывается
             до «Оплачено», деньги не списываются */
          <div className="mt-3 flex gap-2">
            <a
              href={`/pay/demo?provider=payme&amount=${bill.due ?? bill.total}`}
              className="flex-1 rounded-full bg-gold px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              Payme
            </a>
            <a
              href={`/pay/demo?provider=click&amount=${bill.due ?? bill.total}`}
              className="flex-1 rounded-full border border-gold/40 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gold transition-colors hover:bg-gold/10"
            >
              Click
            </a>
          </div>
        ) : (
          (bill.paymeUrl || bill.clickUrl) && (
            <div className="mt-3 flex gap-2">
              {bill.paymeUrl && (
                <a
                  href={bill.paymeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-full bg-gold px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Payme
                </a>
              )}
              {bill.clickUrl && (
                <a
                  href={bill.clickUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-full border border-gold/40 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gold transition-colors hover:bg-gold/10"
                >
                  Click
                </a>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
