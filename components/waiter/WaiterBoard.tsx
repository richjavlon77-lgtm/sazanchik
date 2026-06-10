"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { advanceOrder, resolveCall } from "@/lib/waiter-actions";
import { cn } from "@/lib/utils";

export type BoardOrder = {
  id: string;
  tableNumber: string;
  status: "pending" | "cooking" | "delivered" | "cancelled";
  totalPrice: number;
  createdAt: string;
  isBirthday: boolean;
  items: { name: string; qty: number }[];
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
}: {
  orders: BoardOrder[];
  calls: BoardCall[];
  waiterName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [, setTick] = useState(0);
  const [online, setOnline] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

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
    const ids = new Set<string>([
      ...orders.map((o) => `o:${o.id}`),
      ...calls.map((c) => `c:${c.id}`),
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
  }, [orders, calls, soundOn, beep]);

  // Real-time push via SSE (instant). Auto-reconnects on its own.
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/waiter/api/stream");
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
  useEffect(() => {
    const up = () => {
      setOnline(true);
      router.refresh();
    };
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
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
    await fetch("/waiter/api/logout", { method: "POST" });
    router.push("/waiter/login");
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pb-20 pt-5">
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
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Active calls — top priority */}
      {calls.length > 0 && (
        <div className="mb-5 space-y-2">
          {calls.map((c) => {
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
        Заказы · {orders.length}
      </div>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 px-5 py-12 text-center text-sm text-muted-foreground">
          Активных заказов нет. Доска обновляется сама.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const s = STATUS[o.status] ?? STATUS.pending;
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

                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.name} <span className="text-gold">×{it.qty}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-heading tabular-nums text-gold">
                    {o.totalPrice.toLocaleString("ru-RU")} сум
                  </span>
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
                        className="rounded-full border border-emerald-500/40 px-4 py-1.5 text-xs uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-40"
                      >
                        Подан
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
  );
}
