"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  useCallback,
  useOptimistic,
} from "react";
import { useRouter } from "next/navigation";
import { useOnline } from "@/lib/local-store";
import Link from "next/link";
import { toast } from "sonner";
import { advanceOrder, resolveCall, toggleItemDelivered } from "@/lib/waiter-actions";
import { OrderComposer } from "@/components/waiter/OrderComposer";
import type { ComposerItem } from "@/lib/composer-data";
import { cn } from "@/lib/utils";

export type BoardOrder = {
  id: string;
  tableNumber: string;
  status: "pending" | "cooking" | "delivered" | "cancelled";
  totalPrice: number;
  createdAt: string;
  isBirthday: boolean;
  items: { name: string; qty: number; ready: boolean; delivered: boolean }[];
};

export type BoardCall = {
  id: string;
  tableNumber: string;
  type: "waiter" | "bill" | "water";
  createdAt: string;
};

const CALL_META: Record<BoardCall["type"], { label: string; icon: string }> = {
  waiter: { label: "Зовут официанта", icon: "🙋" },
  bill: { label: "Просят счёт", icon: "💰" },
  water: { label: "Просят воду", icon: "🚰" },
};

const STATUS: Record<string, { text: string; cls: string }> = {
  pending: { text: "Новый", cls: "bg-gold/15 text-gold" },
  cooking: { text: "Готовится", cls: "bg-sky-500/15 text-sky-400" },
  delivered: { text: "Подан", cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled: { text: "Отменён", cls: "bg-red-500/15 text-red-400" },
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  return `${Math.floor(mins / 60)} ч`;
}

export function WaiterBoard({
  orders,
  calls,
  waiterName,
  myTables = [],
  composerItems = [],
}: {
  orders: BoardOrder[];
  calls: BoardCall[];
  waiterName: string;
  myTables?: string[];
  composerItems?: ComposerItem[];
}) {
  const router = useRouter();
  const hasZone = myTables.length > 0;
  const [onlyMine, setOnlyMine] = useState(hasZone);
  const [composerOpen, setComposerOpen] = useState(false);
  const [pending, start] = useTransition();
  const [, setTick] = useState(0);
  const online = useOnline();
  const [soundOn, setSoundOn] = useState(false);

  // Optimistic per-dish delivery ticks. useOptimistic auto-reverts to the
  // server data once the action's transition settles, so ticks stay correct
  // and sync across devices via SSE — no manual reset needed.
  const [optimisticOrders, markDelivered] = useOptimistic(
    orders,
    (
      state: BoardOrder[],
      u: { orderId: string; index: number; delivered: boolean }
    ) =>
      state.map((o) =>
        o.id === u.orderId
          ? {
              ...o,
              items: o.items.map((it, i) =>
                i === u.index ? { ...it, delivered: u.delivered } : it
              ),
            }
          : o
      )
  );

  const toggleItem = (orderId: string, index: number, next: boolean) => {
    start(async () => {
      markDelivered({ orderId, index, delivered: next });
      try {
        await toggleItemDelivered(orderId, index, next);
      } catch {
        toast.error("Не удалось отметить");
      }
    });
  };

  const mine = new Set(myTables);
  const shownOrders =
    onlyMine && hasZone
      ? optimisticOrders.filter((o) => mine.has(o.tableNumber))
      : optimisticOrders;
  const shownCalls =
    onlyMine && hasZone ? calls.filter((c) => mine.has(c.tableNumber)) : calls;

  const audioRef = useRef<AudioContext | null>(null);
  const knownRef = useRef<Set<string> | null>(null);

  // Audio beep (primed by a user gesture to satisfy autoplay policies)
  const beep = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.18);
    });
  }, []);

  const enableSound = () => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      ctx.resume();
      setSoundOn(true);
      beep();
      toast.success("Звук включён");
    } catch {
      toast.error("Звук недоступен");
    }
  };

  // Detect newly-arrived orders/calls → beep
  useEffect(() => {
    // Only beep for the tables this waiter actually watches
    const inScope = (table: string) => !onlyMine || !hasZone || mine.has(table);
    const ids = new Set<string>([
      ...orders.filter((o) => inScope(o.tableNumber)).map((o) => `o:${o.id}`),
      ...calls.filter((c) => inScope(c.tableNumber)).map((c) => `c:${c.id}`),
    ]);
    if (knownRef.current === null) {
      knownRef.current = ids; // first render — prime, no beep
      return;
    }
    let hasNew = false;
    ids.forEach((id) => {
      if (!knownRef.current!.has(id)) hasNew = true;
    });
    if (hasNew && soundOn) beep();
    knownRef.current = ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, calls, onlyMine, soundOn, beep]);

  // Real-time push via SSE (instant). Auto-reconnects on its own.
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/staff/stream");
      es.onmessage = (e) => {
        if (e.data === "update") router.refresh();
      };
    } catch {
      /* SSE unavailable — the safety poll below still keeps things fresh */
    }
    return () => es?.close();
  }, [router]);

  // Safety net: refresh every 25s + tick relative times (in case SSE drops)
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      if (navigator.onLine) router.refresh();
    }, 25000);
    return () => clearInterval(id);
  }, [router]);

  // Online/offline awareness — calls persist in DB, so nothing is lost
  // Refresh the board the moment the connection returns; the `online`
  // indicator itself comes from useOnline() (useSyncExternalStore).
  useEffect(() => {
    const up = () => router.refresh();
    window.addEventListener("online", up);
    return () => window.removeEventListener("online", up);
  }, [router]);

  const doOrder = (id: string, status: BoardOrder["status"], label: string) =>
    start(async () => {
      try {
        await advanceOrder(id, status);
        toast.success(label);
      } catch {
        toast.error("Не удалось обновить");
      }
    });

  const doCancel = (id: string, table: string) => {
    if (!confirm(`Отменить заказ стола №${table}? Склад вернётся.`)) return;
    doOrder(id, "cancelled", "Заказ отменён");
  };

  const doResolve = (id: string) =>
    start(async () => {
      try {
        await resolveCall(id);
        toast.success("Вызов закрыт");
      } catch {
        toast.error("Не удалось закрыть");
      }
    });

  const logout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff");
    router.refresh();
  };

  return (
    <>
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pb-24 pt-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl">
            Привет, <span className="text-gold">{waiterName}</span>
          </h1>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                online ? "animate-pulse bg-emerald-400" : "bg-red-500"
              )}
            />
            {online ? "Живая доска" : "Нет сети — переподключаемся"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/waiter/bills"
            className="rounded-full border border-gold/40 px-3 py-2 text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
          >
            🧾 Счета
          </Link>
          {!soundOn && (
            <button
              onClick={enableSound}
              className="rounded-full border border-gold/40 px-3 py-2 text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
            >
              🔔 Звук
            </button>
          )}
          <button
            onClick={logout}
            title="Закрыть смену и сменить сотрудника"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            🔑 Сменить
          </button>
        </div>
      </header>

      {/* Zone filter */}
      {hasZone && (
        <div className="mb-4 inline-flex rounded-full border border-border bg-card/40 p-0.5 text-xs">
          {[
            { v: true, label: `Мои столы (${myTables.join(", ")})` },
            { v: false, label: "Все" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => setOnlyMine(o.v)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                onlyMine === o.v
                  ? "bg-gold text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Active calls — top priority */}
      {shownCalls.length > 0 && (
        <div className="mb-5 space-y-2">
          {shownCalls.map((c) => {
            const m = CALL_META[c.type];
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <div className="font-heading text-lg">
                      Стол №{c.tableNumber}
                    </div>
                    <div className="text-xs text-red-300">
                      {m.label} · {timeAgo(c.createdAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => doResolve(c.id)}
                  disabled={pending}
                  className="rounded-full bg-red-500 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Принял
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders */}
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Заказы · {shownOrders.length}
      </div>
      {shownOrders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 px-5 py-12 text-center text-sm text-muted-foreground">
          Активных заказов нет. Доска обновляется сама.
        </div>
      ) : (
        <div className="space-y-3">
          {shownOrders.map((o) => {
            const s = STATUS[o.status] ?? STATUS.pending;
            const doneCount = o.items.filter((it) => it.delivered).length;
            const allDone = o.items.length > 0 && doneCount === o.items.length;
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xl">
                      Стол №{o.tableNumber}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
                        s.cls
                      )}
                    >
                      {s.text}
                    </span>
                    {o.isBirthday && (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">
                        🎂 ДР · −10%
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(o.createdAt)}
                  </span>
                </div>

                <ul className="mt-2 space-y-0.5 text-sm">
                  {o.items.map((it, i) => {
                    const done = it.delivered;
                    const readyToCarry = it.ready && !done;
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => toggleItem(o.id, i, !done)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors active:scale-[0.99]",
                            done
                              ? "text-muted-foreground/60"
                              : readyToCarry
                                ? "bg-emerald-500/5 text-foreground hover:bg-emerald-500/10"
                                : "text-muted-foreground hover:bg-card"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] transition-colors",
                              done
                                ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                                : readyToCarry
                                  ? "border-emerald-500/60 text-transparent"
                                  : "border-border text-transparent"
                            )}
                          >
                            ✓
                          </span>
                          <span className={cn("flex-1", done && "line-through")}>
                            {it.name}{" "}
                            <span className={done ? "text-emerald-400/60" : "text-gold"}>
                              ×{it.qty}
                            </span>
                          </span>
                          {readyToCarry && (
                            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400">
                              🍽 можно нести
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-heading tabular-nums text-gold">
                      {o.totalPrice.toLocaleString("ru-RU")} сум
                    </span>
                    {o.items.length > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] tabular-nums",
                          allDone
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-card text-muted-foreground"
                        )}
                      >
                        {allDone ? "✓ всё отнесено" : `отнесено ${doneCount}/${o.items.length}`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {o.status === "pending" && (
                      <button
                        onClick={() => doOrder(o.id, "cooking", "Принято в работу")}
                        disabled={pending}
                        className="rounded-full border border-sky-500/40 px-4 py-1.5 text-xs uppercase tracking-wider text-sky-400 transition-colors hover:bg-sky-500 hover:text-white disabled:opacity-40"
                      >
                        Принять
                      </button>
                    )}
                    {(o.status === "pending" || o.status === "cooking") && (
                      <button
                        onClick={() => doOrder(o.id, "delivered", "Заказ подан")}
                        disabled={pending}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-40",
                          allDone
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-white"
                            : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                        )}
                      >
                        Подан
                      </button>
                    )}
                    {(o.status === "pending" || o.status === "cooking") && (
                      <button
                        onClick={() => doCancel(o.id, o.tableNumber)}
                        disabled={pending}
                        className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                      >
                        Отмена
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>

      {/* Offline order — waiter takes a verbal order and routes it to stations */}
      <button
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-safe-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_30px_-6px_var(--gold)] transition-transform active:scale-95"
      >
        + Новый заказ
      </button>

      {composerOpen && (
        <OrderComposer
          items={composerItems}
          defaultTable={myTables[0] ?? ""}
          onClose={() => setComposerOpen(false)}
        />
      )}
    </>
  );
}
