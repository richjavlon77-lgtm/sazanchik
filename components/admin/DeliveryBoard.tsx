"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setDeliveryStatus, type DeliveryStatus } from "@/lib/delivery-actions";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  phone: string;
  address: string;
  items: string;
  status: DeliveryStatus;
  fromBot: boolean;
  createdAt: string;
};

const STATUS: Record<DeliveryStatus, { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-gold/15 text-gold" },
  confirmed: { label: "Подтверждена", cls: "bg-sky-500/15 text-sky-600" },
  courier: { label: "Курьер в пути", cls: "bg-violet-500/15 text-violet-600" },
  done: { label: "Доставлена", cls: "bg-emerald-500/15 text-emerald-600" },
  cancelled: { label: "Отменена", cls: "bg-red-500/15 text-red-500" },
};

/** Следующий логичный шаг для крупной основной кнопки */
const NEXT: Partial<Record<DeliveryStatus, { to: DeliveryStatus; label: string }>> = {
  new: { to: "confirmed", label: "✅ Подтвердить" },
  confirmed: { to: "courier", label: "🛵 Курьер выехал" },
  courier: { to: "done", label: "🎉 Доставлена" },
};

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h} ч назад` : new Date(iso).toLocaleDateString("ru-RU");
};

export function DeliveryBoard({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const move = (id: string, to: DeliveryStatus) =>
    start(async () => {
      try {
        await setDeliveryStatus(id, to);
        toast.success(`Статус: ${STATUS[to].label}`);
        router.refresh();
      } catch {
        toast.error("Не получилось — попробуйте ещё раз");
      }
    });

  const active = rows.filter((r) => ["new", "confirmed", "courier"].includes(r.status));
  const finished = rows.filter((r) => ["done", "cancelled"].includes(r.status));

  if (!rows.length) {
    return (
      <p className="rounded-3xl border border-border bg-white/70 px-5 py-12 text-center text-sm text-muted-foreground">
        Заявок пока нет. Они приходят из Telegram-бота и мини-аппа доставки.
      </p>
    );
  }

  const Card = ({ r }: { r: Row }) => (
    <article
      className={cn(
        "rounded-3xl border p-5 shadow-[0_10px_30px_-20px_rgba(23,21,15,0.3)]",
        r.status === "new"
          ? "border-gold/60 bg-gradient-to-br from-gold/[0.08] to-transparent"
          : "border-border bg-white/70"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS[r.status].cls)}>
          {STATUS[r.status].label}
        </span>
        {r.fromBot && (
          <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-sky-600">
            ✈ бот — статусы уходят гостю
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="font-medium text-gold">
          📞 {r.phone}
        </a>
        <span className="text-muted-foreground">📍 {r.address}</span>
      </div>

      <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-background/70 px-4 py-3 font-sans text-[13px] leading-relaxed">
        {r.items}
      </pre>

      <div className="mt-4 flex flex-wrap gap-2">
        {NEXT[r.status] && (
          <button
            onClick={() => move(r.id, NEXT[r.status]!.to)}
            disabled={pending}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {NEXT[r.status]!.label}
          </button>
        )}
        {["new", "confirmed", "courier"].includes(r.status) && (
          <button
            onClick={() => {
              if (confirm("Отменить заявку? Гость из бота получит уведомление.")) {
                move(r.id, "cancelled");
              }
            }}
            disabled={pending}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            Отменить
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-gold">
            — В работе · {active.length} —
          </h2>
          {active.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </section>
      )}
      {finished.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            — Завершённые —
          </h2>
          {finished.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </section>
      )}
    </div>
  );
}
