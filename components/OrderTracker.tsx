"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocalString, writeLocal } from "@/lib/local-store";

type Stored = { id: string; table: string; at: number };
type Status = "pending" | "cooking" | "delivered" | "cancelled";

const STORAGE_KEY = "sazanchik:lastOrder";
const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4h
const STEPS: { key: Status; label: string }[] = [
  { key: "pending", label: "Принят" },
  { key: "cooking", label: "Готовится" },
  { key: "delivered", label: "Подан" },
];

export function OrderTracker() {
  // The last order lives in localStorage; CartBar writes it via writeLocal,
  // so this component re-renders automatically — no events, no manual load().
  const raw = useLocalString(STORAGE_KEY);
  const order = useMemo<Stored | null>(() => {
    if (!raw) return null;
    try {
      const o = JSON.parse(raw) as Stored;
      return o?.id ? o : null;
    } catch {
      return null;
    }
  }, [raw]);
  const [status, setStatus] = useState<Status>("pending");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = () => writeLocal(STORAGE_KEY, null);

  // Expire stale orders (side effect — Date.now is fine here)
  useEffect(() => {
    if (order && Date.now() - order.at > MAX_AGE_MS) {
      writeLocal(STORAGE_KEY, null);
    }
  }, [order]);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!cancelled) dismiss();
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { status: Status };
        if (!cancelled) setStatus(data.status);
        if (data.status === "delivered" || data.status === "cancelled") {
          if (timer.current) clearInterval(timer.current);
        }
      } catch {
        /* offline — keep last known status, retry next tick */
      }
    };
    poll();
    timer.current = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [order]);

  if (!order) return null;

  const activeIndex =
    status === "delivered" ? 2 : status === "cooking" ? 1 : 0;
  const cancelled = status === "cancelled";
  const done = status === "delivered";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] flex justify-center px-4 pt-safe-3">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-gold/25 bg-card/95 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {cancelled
              ? "Заказ отменён"
              : done
                ? "Готово 🎉"
                : `Ваш заказ · стол №${order.table}`}
          </span>
          <button
            onClick={dismiss}
            aria-label="Закрыть"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {cancelled ? (
          <p className="mt-1 text-sm text-red-400">
            Свяжитесь с официантом, пожалуйста.
          </p>
        ) : (
          <div className="mt-2.5 flex items-center">
            {STEPS.map((step, i) => {
              const reached = i <= activeIndex;
              const current = i === activeIndex && !done;
              return (
                <div key={step.key} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border text-[10px] transition-colors",
                        reached
                          ? "border-gold bg-gold text-primary-foreground"
                          : "border-muted-foreground/30 text-muted-foreground",
                        current && "ring-3 ring-gold/25"
                      )}
                    >
                      {reached ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[10px]",
                        reached ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "mx-1 mb-4 h-px flex-1 transition-colors",
                        i < activeIndex ? "bg-gold" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
