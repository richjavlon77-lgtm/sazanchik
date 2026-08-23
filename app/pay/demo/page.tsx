"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * ДЕМО-чекаут: показывает шефу конец воронки оплаты до подключения
 * мерчанта. Ничего не списывает и не пишет в кассу — чистая витрина.
 * С реальными ключами Payme/Click кнопки ведут на настоящий чекаут,
 * а эта страница остаётся недостижимой из UI.
 */
function DemoCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const provider = params.get("provider") === "click" ? "Click" : "Payme";
  const amount = Math.max(0, Number(params.get("amount")) || 0);
  const [phase, setPhase] = useState<"form" | "processing" | "done">("form");

  const pay = () => {
    setPhase("processing");
    setTimeout(() => setPhase("done"), 1600);
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#101613] px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Честная плашка: это демонстрация */}
        <div className="mb-4 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-center text-[11px] uppercase tracking-[0.25em] text-amber-300">
          Демо-режим · деньги не списываются
        </div>

        <div className="rounded-3xl border border-[#c5a35c]/30 bg-[#161d19] p-6 text-[#f7f2e8] shadow-2xl">
          <div className="mb-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.4em] text-[#c5a35c]">
              Оплата через
            </div>
            <div className="mt-1 font-heading text-3xl italic">{provider}</div>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Сазанчик CITY · счёт стола
            </div>
            <div className="mt-1.5 font-heading text-3xl tabular-nums text-[#c5a35c]">
              {amount.toLocaleString("ru-RU")} <span className="text-lg">UZS</span>
            </div>
          </div>

          {phase === "form" && (
            <button
              onClick={pay}
              className="w-full rounded-full bg-[#c5a35c] py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#101613] transition-opacity hover:opacity-90"
            >
              Оплатить
            </button>
          )}

          {phase === "processing" && (
            <div className="flex items-center justify-center gap-3 py-3 text-sm text-white/70">
              <span className="size-4 animate-spin rounded-full border-2 border-[#c5a35c] border-t-transparent" />
              Проводим платёж…
            </div>
          )}

          {phase === "done" && (
            <div className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-400">
                ✓
              </div>
              <p className="mt-3 font-heading text-xl">Оплачено!</p>
              <p className="mt-1 text-xs text-white/50">
                Это демонстрация — официант получит уведомление,
                когда подключим настоящую оплату.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-5 w-full rounded-full border border-[#c5a35c]/50 py-3 text-xs uppercase tracking-[0.2em] text-[#c5a35c] transition-colors hover:bg-[#c5a35c]/10"
              >
                Вернуться в меню
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.25em] text-white/30">
          Сазанчик CITY · онлайн-оплата
        </p>
      </div>
    </main>
  );
}

export default function DemoPayPage() {
  return (
    <Suspense>
      <DemoCheckout />
    </Suspense>
  );
}
