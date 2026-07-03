"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { reorderCategories } from "@/lib/admin-actions";

export type CategoryRow = {
  id: string;
  slug: string;
  nameRu: string;
  isPublished: boolean;
  dishCount: number;
};

export function CategorySortList({ categories }: { categories: CategoryRow[] }) {
  const [items, setItems] = useState(categories);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const persist = (next: CategoryRow[], prev: CategoryRow[]) => {
    setItems(next);
    reorderCategories(next.map((x) => x.id))
      .then(() => toast.success("Порядок категорий сохранён"))
      .catch(() => {
        setItems(prev);
        toast.error("Ошибка сортировки — порядок не сохранён");
      });
  };

  const handleDrop = (targetId: string) => {
    setOverId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = items.findIndex((x) => x.id === dragId);
    const to = items.findIndex((x) => x.id === targetId);
    setDragId(null);
    if (from === -1 || to === -1) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist(next, items);
  };

  // Touch/tablet fallback — native HTML5 drag-and-drop doesn't fire on
  // touch devices, so reordering needs a tap-based path too.
  const move = (id: string, dir: -1 | 1) => {
    const from = items.findIndex((x) => x.id === id);
    const to = from + dir;
    if (from === -1 || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist(next, items);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      {items.map((c) => (
        <div
          key={c.id}
          draggable
          onDragStart={() => setDragId(c.id)}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== c.id) setOverId(c.id);
          }}
          onDrop={() => handleDrop(c.id)}
          className={
            "flex items-center gap-3 border-b border-border/50 px-5 py-3 last:border-b-0 transition-colors " +
            (dragId === c.id ? "opacity-40 " : "") +
            (overId === c.id && dragId !== c.id ? "bg-gold/10 " : "hover:bg-card/60 ")
          }
        >
          <span
            className="hidden shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing sm:inline-flex"
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

          <span className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={() => move(c.id, -1)}
              disabled={items[0]?.id === c.id}
              aria-label="Выше"
              className="flex size-5 items-center justify-center text-muted-foreground/60 hover:text-gold disabled:opacity-20"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(c.id, 1)}
              disabled={items[items.length - 1]?.id === c.id}
              aria-label="Ниже"
              className="flex size-5 items-center justify-center text-muted-foreground/60 hover:text-gold disabled:opacity-20"
            >
              ▼
            </button>
          </span>

          <Link
            href={`/admin/categories/${c.id}/edit`}
            className="min-w-0 flex-1"
          >
            <div className="font-heading text-base">{c.nameRu}</div>
            <div className="text-xs text-muted-foreground">/{c.slug}</div>
          </Link>

          <span className="shrink-0 text-xs text-muted-foreground">
            {c.dishCount} блюд
          </span>
          {!c.isPublished && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
              hidden
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
