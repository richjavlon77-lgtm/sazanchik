"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { setDishStock } from "@/lib/cook-actions";
import { cn } from "@/lib/utils";

export type KitchenDish = {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
};

export function KitchenBoard({
  dishes,
  cookName,
}: {
  dishes: KitchenDish[];
  cookName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  // optimistic availability map
  const [stock, setStock] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(dishes.map((d) => [d.id, d.inStock]))
  );

  const stoppedCount = dishes.filter((d) => stock[d.id] === false).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dishes;
    return dishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [dishes, query]);

  // group by category, preserving server order
  const groups = useMemo(() => {
    const map = new Map<string, KitchenDish[]>();
    for (const d of filtered) {
      if (!map.has(d.category)) map.set(d.category, []);
      map.get(d.category)!.push(d);
    }
    return [...map.entries()];
  }, [filtered]);

  const stopped = dishes.filter((d) => stock[d.id] === false);

  const toggle = (d: KitchenDish) => {
    const next = !(stock[d.id] ?? true);
    setStock((s) => ({ ...s, [d.id]: next })); // optimistic
    start(async () => {
      try {
        await setDishStock(d.id, next);
        toast.success(
          next ? `«${d.name}» снова в наличии` : `«${d.name}» в стоп-листе`
        );
      } catch {
        setStock((s) => ({ ...s, [d.id]: !next })); // revert
        toast.error("Не удалось изменить");
      }
    });
  };

  const logout = async () => {
    await fetch("/waiter/api/logout", { method: "POST" });
    router.push("/kitchen/login");
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pb-20 pt-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl">
            Кухня · <span className="text-gold">{cookName}</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Стоп-лист {stoppedCount > 0 ? `· ${stoppedCount} на стопе` : "· всё в наличии"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/kitchen"
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            ← Заказы
          </Link>
          <button
            onClick={logout}
            className="rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Currently stopped — quick to bring back */}
      {stopped.length > 0 && (
        <div className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-red-300">
            На стопе сейчас · {stopped.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {stopped.map((d) => (
              <button
                key={d.id}
                onClick={() => toggle(d)}
                disabled={pending}
                className="rounded-full border border-red-500/50 bg-background/40 px-3 py-1.5 text-xs text-red-200 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-40"
              >
                {d.name} · вернуть ↩
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск блюда или категории…"
        className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20"
      />

      <div className="space-y-5">
        {groups.map(([cat, items]) => (
          <section key={cat}>
            <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {cat}
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card/40">
              {items.map((d) => {
                const ok = stock[d.id] ?? true;
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0"
                  >
                    <span
                      className={cn(
                        "text-sm",
                        ok ? "" : "text-muted-foreground line-through"
                      )}
                    >
                      {d.name}
                    </span>
                    <button
                      onClick={() => toggle(d)}
                      disabled={pending}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors disabled:opacity-40",
                        ok
                          ? "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                          : "border border-red-500/50 bg-red-500/15 text-red-300 hover:bg-red-500 hover:text-white"
                      )}
                    >
                      {ok ? "В наличии" : "Стоп"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
