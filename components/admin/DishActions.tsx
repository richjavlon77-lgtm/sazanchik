"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function DishActions({ id, slug }: { id: string; slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить блюдо "${slug}"?`)) return;
    setBusy(true);
    const p = fetch(`/admin/api/dishes/${id}`, { method: "DELETE" }).then(
      (res) => {
        if (!res.ok) throw new Error("delete failed");
        router.refresh();
      }
    );
    toast.promise(p, {
      loading: "Удаляем…",
      success: "Блюдо удалено",
      error: "Ошибка удаления",
    });
    try {
      await p;
    } catch {
      /* handled by toast */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/dishes/${id}/edit`}
        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Edit"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        aria-label="Delete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
