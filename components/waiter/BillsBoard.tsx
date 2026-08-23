"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useOnline } from "@/lib/local-store";
import Link from "next/link";
import { toast } from "sonner";
import { closeBill } from "@/lib/bills-actions";
import type { Bill } from "@/lib/bills-data";
import { tableLabel } from "@/lib/tables";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  return `${Math.floor(mins / 60)} ч ${mins % 60} мин`;
}

export function BillsBoard({ bills, name }: { bills: Bill[]; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [, setTick] = useState(0);
  const online = useOnline();

  // Real-time via the shared SSE channel + safety poll
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/waiter/api/stream");
      es.onmessage = (e) => {
        if (e.data === "update") router.refresh();
      };
    } catch {
      /* poll keeps it fresh */
    }
    return () => es?.close();
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      if (navigator.onLine) router.refresh();
    }, 25000);
    return () => clearInterval(id);
  }, [router]);

  // Refresh the board the moment the connection returns; the `online`
  // indicator itself comes from useOnline() (useSyncExternalStore).
  useEffect(() => {
    const up = () => router.refresh();
    window.addEventListener("online", up);
    return () => window.removeEventListener("online", up);
  }, [router]);

  const close = (b: Bill) => {
    if (
      !confirm(
        `Закрыть счёт · ${tableLabel(b.tableNumber)} на ${b.total.toLocaleString("ru-RU")} сум? Гость оплатил.`
      )
    )
      return;
    start(async () => {
      try {
        await closeBill(b.id);
        toast.success(`Счёт закрыт · ${tableLabel(b.tableNumber)}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось закрыть");
      }
    });
  };

  const grand = bills.reduce((s, b) => s + b.total, 0);

  return (
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pb-20 pt-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl">
            Счета · <span className="text-gold">{name}</span>
          </h1>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                online ? "animate-pulse bg-emerald-400" : "bg-red-500"
              )}
            />
            {online ? `Открыто столов: ${bills.length}` : "Нет сети"}
          </p>
        </div>
        <Link
          href="/waiter"
          className="shrink-0 rounded-full border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          ← Заказы
        </Link>
      </header>

      {bills.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 px-5 py-12 text-center text-sm text-muted-foreground">
          Открытых счетов нет. Счёт открывается с первым заказом стола.
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-xl border border-gold/20 bg-card/40 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Сумма открытых счетов: </span>
            <span className="font-heading tabular-nums text-gold">
              {grand.toLocaleString("ru-RU")} сум
            </span>
          </div>
          <div className="space-y-3">
            {bills.map((b) => (
              <article
                key={b.id}
                className="rounded-2xl border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xl">
                    {tableLabel(b.tableNumber)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {b.orderCount} заказ. · {timeAgo(b.openedAt)}
                  </span>
                </div>

                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  {b.lines.map((l, i) => (
                    <li key={i}>
                      {l.name} <span className="text-gold">×{l.qty}</span>
                    </li>
                  ))}
                </ul>

                {/* Онлайн-оплата: бейдж «оплачено» / ссылки, когда провайдер включён */}
                {b.paidOnline >= b.total && b.total > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                    💳 Оплачено онлайн · {b.paidOnline.toLocaleString("ru-RU")} сум
                  </div>
                )}
                {b.paidOnline < b.total && b.demo && (
                  <div className="mt-2 flex items-center gap-2">
                    {(["payme", "click"] as const).map((prov) => (
                      <a
                        key={prov}
                        href={`/pay/demo?provider=${prov}&amount=${b.total - b.paidOnline}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        {prov === "payme" ? "Payme" : "Click"}
                      </a>
                    ))}
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      демо
                    </span>
                  </div>
                )}
                {b.paidOnline < b.total && !b.demo && (b.paymeUrl || b.clickUrl) && (
                  <div className="mt-2 flex gap-2">
                    {b.paymeUrl && (
                      <a
                        href={b.paymeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        Payme
                      </a>
                    )}
                    {b.clickUrl && (
                      <a
                        href={b.clickUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        Click
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-heading text-lg tabular-nums text-gold">
                    {b.total.toLocaleString("ru-RU")} сум
                  </span>
                  <button
                    onClick={() => close(b)}
                    disabled={pending}
                    className="rounded-full bg-gold px-5 py-2 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Закрыть · оплачено
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
