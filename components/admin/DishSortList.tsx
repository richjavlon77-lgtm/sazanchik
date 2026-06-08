"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatPrice } from "@/lib/i18n-core";
import { reorderDishes } from "@/lib/admin-actions";
import { DishActions } from "@/components/admin/DishActions";

export type DishRow = {
  id: string;
  slug: string;
  nameRu: string;
  descriptionRu: string | null;
  price: number | null;
  isPublished: boolean;
  spicy: number | null;
};

export function DishSortList({ dishes }: { dishes: DishRow[] }) {
  const [items, setItems] = useState(dishes);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    setOverId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = items.findIndex((x) => x.id === dragId);
    const to = items.findIndex((x) => x.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    reorderDishes(next.map((x) => x.id))
      .then(() => toast.success("Порядок сохранён"))
      .catch(() => toast.error("Ошибка сортировки"));
  };

  return (
    <ul>
      {items.map((d) => (
        <li
          key={d.id}
          draggable
          onDragStart={() => setDragId(d.id)}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== d.id) setOverId(d.id);
          }}
          onDrop={() => handleDrop(d.id)}
          className={
            "flex items-center gap-3 border-b border-border/50 px-5 py-3 last:border-b-0 transition-colors " +
            (dragId === d.id ? "opacity-40 " : "") +
            (overId === d.id && dragId !== d.id
              ? "bg-gold/10 "
              : "hover:bg-card/60 ")
          }
        >
          {/* Drag handle */}
          <span
            className="shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing"
            aria-hidden
            title="Перетащить"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
              <circle cx="9" cy="6" r="1.6" />
              <circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" />
              <circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" />
              <circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>

          <Link href={`/admin/dishes/${d.id}/edit`} className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3">
              <span className="truncate font-heading text-base">{d.nameRu}</span>
              {!d.isPublished && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  hidden
                </span>
              )}
              {d.spicy ? (
                <span className="text-[9px]">{"🌶".repeat(d.spicy)}</span>
              ) : null}
            </div>
            {d.descriptionRu && (
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {d.descriptionRu}
              </div>
            )}
          </Link>

          <span className="shrink-0 font-heading tabular-nums text-gold">
            {d.price !== null ? formatPrice(d.price, "ru") : "—"}
          </span>

          <DishActions id={d.id} slug={d.slug} />
        </li>
      ))}
    </ul>
  );
}
