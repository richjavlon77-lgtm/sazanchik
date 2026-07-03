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
import { markStationReady, toggleItemReady } from "@/lib/station-actions";
import { STATIONS, type StationKey } from "@/lib/stations";
import { cn } from "@/lib/utils";

export type StationOrder = {
  id: string;
  tableNumber: string;
  createdAt: string;
  items: { name: string; qty: number; ready: boolean; index: number }[];
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  return `${Math.floor(mins / 60)} ч`;
}

export function StationBoard({
  station,
  orders,
  name,
  secondaryLink,
}: {
  station: StationKey;
  orders: StationOrder[];
  name: string;
  secondaryLink?: { href: string; label: string };
}) {
  const cfg = STATIONS[station];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [, setTick] = useState(0);
  const online = useOnline();
  const [soundOn, setSoundOn] = useState(false);

  // Optimistic per-dish ready ticks; auto-reverts to server data on refresh.
  const [optimisticOrders, markReadyOptimistic] = useOptimistic(
    orders,
    (
      state: StationOrder[],
      u: { orderId: string; index: number; ready: boolean }
    ) =>
      state.map((o) =>
        o.id === u.orderId
          ? {
              ...o,
              items: o.items.map((it) =>
                it.index === u.index ? { ...it, ready: u.ready } : it
              ),
            }
          : o
      )
  );

  const toggleItem = (orderId: string, index: number, next: boolean) => {
    start(async () => {
      markReadyOptimistic({ orderId, index, ready: next });
      try {
        await toggleItemReady(orderId, index, next);
      } catch {
        toast.error("Не удалось отметить");
      }
    });
  };

  const audioRef = useRef<AudioContext | null>(null);
  const knownRef = useRef<Set<string> | null>(null);

  const beep = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [784, 1046].forEach((freq, i) => {
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

  useEffect(() => {
    const ids = new Set(orders.map((o) => o.id));
    if (knownRef.current === null) {
      knownRef.current = ids;
      return;
    }
    let hasNew = false;
    ids.forEach((id) => {
      if (!knownRef.current!.has(id)) hasNew = true;
    });
    if (hasNew && soundOn) beep();
    knownRef.current = ids;
  }, [orders, soundOn, beep]);

  // Real-time via the shared SSE channel
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/waiter/api/stream");
      es.onmessage = (e) => {
        if (e.data === "update") router.refresh();
      };
    } catch {
      /* SSE unavailable — safety poll keeps it fresh */
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

  const ready = (id: string) =>
    start(async () => {
      try {
        await markStationReady(id, station);
        toast.success(cfg.readyToast);
      } catch {
        toast.error("Не удалось отметить");
      }
    });

  const logout = async () => {
    await fetch("/waiter/api/logout", { method: "POST" });
    router.push("/staff");
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pb-20 pt-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl">
            {cfg.title} · <span className="text-gold">{name}</span>
          </h1>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                online ? "animate-pulse bg-emerald-400" : "bg-red-500"
              )}
            />
            {online ? cfg.headerSub : "Нет сети — переподключаемся"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {secondaryLink && (
            <Link
              href={secondaryLink.href}
              className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              {secondaryLink.label}
            </Link>
          )}
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

      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {cfg.listLabel} · {optimisticOrders.length}
      </div>

      {optimisticOrders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 px-5 py-12 text-center text-sm text-muted-foreground">
          {cfg.emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {optimisticOrders.map((o) => {
            const doneCount = o.items.filter((it) => it.ready).length;
            const allDone =
              o.items.length > 0 && doneCount === o.items.length;
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xl">
                    Стол №{o.tableNumber}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(o.createdAt)}
                  </span>
                </div>

                <ul className="mt-2 space-y-0.5 text-sm">
                  {o.items.map((it) => (
                    <li key={it.index}>
                      <button
                        type="button"
                        onClick={() => toggleItem(o.id, it.index, !it.ready)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors active:scale-[0.99]",
                          it.ready
                            ? "text-muted-foreground/60"
                            : "text-foreground hover:bg-card"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] transition-colors",
                            it.ready
                              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                              : "border-border text-transparent"
                          )}
                        >
                          ✓
                        </span>
                        <span className="shrink-0">{cfg.icon}</span>
                        <span
                          className={cn("flex-1", it.ready && "line-through")}
                        >
                          {it.name}{" "}
                          <span
                            className={
                              it.ready ? "text-emerald-400/60" : "text-gold"
                            }
                          >
                            ×{it.qty}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] tabular-nums",
                      allDone
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-card text-muted-foreground"
                    )}
                  >
                    {allDone
                      ? "✓ всё готово"
                      : `готово ${doneCount}/${o.items.length}`}
                  </span>
                  <button
                    onClick={() => ready(o.id)}
                    disabled={pending}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-40",
                      allDone
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-white"
                        : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                    )}
                  >
                    {cfg.readyLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
