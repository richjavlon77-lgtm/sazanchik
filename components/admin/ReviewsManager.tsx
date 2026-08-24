"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setReviewPublished, deleteReview } from "@/lib/review-actions";
import { tableLabel } from "@/lib/tables";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  rating: number;
  comment: string;
  guestName: string | null;
  tableNumber: string | null;
  dishName: string | null;
  isPublished: boolean;
  createdAt: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ReviewsManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const toggle = (r: Row) =>
    start(async () => {
      try {
        await setReviewPublished(r.id, !r.isPublished);
        toast.success(r.isPublished ? "Скрыт с сайта" : "Опубликован на сайте");
        router.refresh();
      } catch {
        toast.error("Не получилось");
      }
    });

  const remove = (r: Row) => {
    if (!confirm("Удалить отзыв навсегда?")) return;
    start(async () => {
      try {
        await deleteReview(r.id);
        toast.success("Удалён");
        router.refresh();
      } catch {
        toast.error("Не получилось");
      }
    });
  };

  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
        Отзывов пока нет. Форма — внизу главной страницы сайта.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <article
          key={r.id}
          className={cn(
            "rounded-2xl border p-4",
            r.isPublished ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-border bg-card/40"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gold">{"★".repeat(r.rating)}</span>
            <span className="text-muted-foreground/40">{"★".repeat(5 - r.rating)}</span>
            {r.guestName && <span className="text-sm">{r.guestName}</span>}
            {r.dishName && (
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                🍽 {r.dishName}
              </span>
            )}
            {r.tableNumber && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {tableLabel(r.tableNumber)}
              </span>
            )}
            <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
              {fmt(r.createdAt)}
            </span>
          </div>
          {r.comment && <p className="mt-2 text-sm">«{r.comment}»</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => toggle(r)}
              disabled={pending}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition-colors disabled:opacity-50",
                r.isPublished
                  ? "border border-border text-muted-foreground hover:text-foreground"
                  : "bg-gold text-primary-foreground hover:opacity-90"
              )}
            >
              {r.isPublished ? "Скрыть" : "Опубликовать"}
            </button>
            <button
              onClick={() => remove(r)}
              disabled={pending}
              className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Удалить
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
