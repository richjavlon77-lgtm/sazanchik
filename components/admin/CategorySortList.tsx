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
    reorderCategories(next.map((x) => x.id))
      .then(() => toast.success("Порядок категорий сохранён"))
      .catch(() => toast.error("Ошибка сортировки"));
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
