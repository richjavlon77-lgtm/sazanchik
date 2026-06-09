"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { advanceOrder } from "@/lib/waiter-actions";
import { cn } from "@/lib/utils";

export type BoardOrder = {
  id: string;
  tableNumber: string;
  status: "pending" | "cooking" | "delivered" | "cancelled";
  totalPrice: number;
  createdAt: string;
  items: { name: string; qty: number }[];
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const h = Math.floor(mins / 60);
  return `${h} ч назад`;
}

const STATUS: Record<string, { text: string; cls: string }> = {
  pending: { text: "Новый", cls: "bg-gold/15 text-gold" },
  cooking: { text: "Готовится", cls: "bg-sky-500/15 text-sky-400" },
  delivered: { text: "Подан", cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled: { text: "Отменён", cls: "bg-red-500/15 text-red-400" },
};

export function WaiterBoard({
  orders,
  waiterName,
}: {
  orders: BoardOrder[];
  waiterName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [now, setNow] = useState(Date.now());

  // Near-real-time: refresh the server data every 10s (SSE upgrade is next module)
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setNow(Date.now());
    }, 10_000);
    return () => clearInterval(id);
  }, [router]);

  const act = (id: string, status: BoardOrder["status"], label: string) => {
    start(async () => {
      try {
        await advanceOrder(id, status);
        toast.success(label);
      } catch {
        toast.error("Не удалось обновить");
      }
    });
  };

  const logout = async () => {
    await fetch("/waiter/api/logout", { method: "POST" });
    router.push("/waiter/login");
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pb-16 pt-5">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">
            Привет, <span className="text-gold">{waiterName}</span>
          </h1>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Живая доска · {orders.length} активных
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          Выйти
        </button>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 px-5 py-16 text-center text-sm text-muted-foreground">
          Пока нет активных заказов. Доска обновляется автоматически.
        </div>
      ) : (
        <div className="space-y-3" data-now={now}>
          {orders.map((o) => {
            const s = STATUS[o.status] ?? STATUS.pending;
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xl">Стол №{o.tableNumber}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider", s.cls)}>
                      {s.text}
                    </span>
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
                        onClick={() => act(o.id, "cooking", "Принято в работу")}
                        disabled={pending}
                        className="rounded-full border border-sky-500/40 px-4 py-1.5 text-xs uppercase tracking-wider text-sky-400 transition-colors hover:bg-sky-500 hover:text-white disabled:opacity-40"
                      >
                        Принять
                      </button>
                    )}
                    {(o.status === "pending" || o.status === "cooking") && (
                      <button
                        onClick={() => act(o.id, "delivered", "Заказ подан")}
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
