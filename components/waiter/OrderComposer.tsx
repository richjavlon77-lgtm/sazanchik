"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createManualOrder } from "@/lib/waiter-actions";
import type { ComposerItem } from "@/lib/composer-data";
import { tableAlias, VIP_TABLE_NUMBERS } from "@/lib/tables";
import { cn } from "@/lib/utils";

export function OrderComposer({
  items,
  defaultTable = "",
  onClose,
}: {
  items: ComposerItem[];
  defaultTable?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [table, setTable] = useState(defaultTable);
  const [birthday, setBirthday] = useState(false);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  const byKey = useMemo(
    () => Object.fromEntries(items.map((i) => [i.key, i])),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, ComposerItem[]>();
    for (const i of filtered) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category)!.push(i);
    }
    return [...map.entries()];
  }, [filtered]);

  const selected = Object.entries(qty).filter(([, n]) => n > 0);
  const count = selected.reduce((s, [, n]) => s + n, 0);
  const subtotal = selected.reduce(
    (s, [k, n]) => s + (byKey[k]?.price ?? 0) * n,
    0
  );
  // mirror server pricing: −10% birthday, +20% service
  const discount = birthday ? Math.round(subtotal * 0.1) : 0;
  const service = Math.round((subtotal - discount) * 0.2);
  const total = subtotal - discount + service;

  const bump = (key: string, delta: number) =>
    setQty((q) => {
      const next = Math.max(0, (q[key] ?? 0) + delta);
      return { ...q, [key]: next };
    });

  const submit = () => {
    if (!table.trim()) {
      toast.error("Укажите стол");
      return;
    }
    if (count === 0) {
      toast.error("Добавьте позиции");
      return;
    }
    start(async () => {
      try {
        const lines = selected.map(([k, n]) => {
          const it = byKey[k];
          return {
            id: it.id,
            variantKey: it.variantKey,
            nameRu: it.nameRu,
            nameUz: it.nameUz,
            nameEn: it.nameEn,
            variantLabelRu: it.variantLabelRu,
            variantLabelUz: it.variantLabelUz,
            variantLabelEn: it.variantLabelEn,
            price: it.price,
            qty: n,
          };
        });
        await createManualOrder({
          tableNumber: table.trim(),
          isBirthday: birthday,
          lines,
        });
        toast.success(`Заказ на стол №${table.trim()} оформлен`);
        onClose();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось оформить");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-safe-3">
        <h2 className="font-heading text-xl">Новый заказ</h2>
        <button
          onClick={onClose}
          className="rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:border-gold/40 hover:text-gold"
        >
          Закрыть
        </button>
      </div>

      {/* Table + birthday + search */}
      <div className="space-y-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {tableAlias(table) ?? "Стол №"}
          </span>
          <input
            value={table}
            onChange={(e) => setTable(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="5"
            className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm tabular-nums outline-none focus:border-gold/60"
          />
          {/* Кабины идут отдельной нумерацией — официанту не нужно помнить, что VIP 1 это 33 */}
          <span className="flex gap-1">
            {VIP_TABLE_NUMBERS.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTable(num)}
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
                  table === num
                    ? "border-gold/60 bg-gold/15 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold"
                )}
              >
                {tableAlias(num)}
              </button>
            ))}
          </span>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={birthday}
              onChange={(e) => setBirthday(e.target.checked)}
              className="accent-gold"
            />
            🎂 День рождения
          </label>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск блюда…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
        />
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4">
          {groups.map(([cat, list]) => (
            <section key={cat}>
              <div className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {cat}
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card/40">
                {list.map((it) => {
                  const n = qty[it.key] ?? 0;
                  return (
                    <div
                      key={it.key}
                      className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{it.label}</div>
                        <div className="text-[11px] tabular-nums text-gold">
                          {it.price.toLocaleString("ru-RU")} сум
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {n > 0 && (
                          <button
                            onClick={() => bump(it.key, -1)}
                            className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground active:scale-90"
                          >
                            −
                          </button>
                        )}
                        {n > 0 && (
                          <span className="w-4 text-center text-sm tabular-nums">
                            {n}
                          </span>
                        )}
                        <button
                          onClick={() => bump(it.key, 1)}
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full border border-gold/30 text-gold active:scale-90",
                            n > 0 && "bg-gold/10"
                          )}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Sticky submit */}
      <div className="border-t border-border px-4 pt-3 pb-safe-3">
        {count > 0 && (
          <div className="mb-2 flex flex-wrap justify-between gap-x-4 text-[11px] tabular-nums text-muted-foreground">
            <span>Блюда: {subtotal.toLocaleString("ru-RU")}</span>
            {discount > 0 && (
              <span className="text-gold">ДР −{discount.toLocaleString("ru-RU")}</span>
            )}
            <span>Сервис 20%: +{service.toLocaleString("ru-RU")}</span>
          </div>
        )}
        <button
          onClick={submit}
          disabled={pending || count === 0}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-gold py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <span>Оформить</span>
          {count > 0 && (
            <span className="tabular-nums">
              · {count} поз. · {total.toLocaleString("ru-RU")} сум
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
