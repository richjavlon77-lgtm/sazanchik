"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { generateTableQRs } from "@/lib/admin-actions";
import { tableLabel } from "@/lib/tables";

type TableQR = { num: number; url: string; qr: string };

export function TablesQR() {
  const [count, setCount] = useState(35);
  const [items, setItems] = useState<TableQR[]>([]);
  const [pending, start] = useTransition();

  const generate = () =>
    start(async () => {
      try {
        const res = await generateTableQRs(count);
        setItems(res);
        toast.success(`Сгенерировано ${res.length} QR`);
      } catch {
        toast.error("Не удалось сгенерировать");
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gold/20 bg-card/40 p-4 print:hidden">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Сколько столов
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
            }
            className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-gold/60"
          />
        </div>
        <button
          onClick={generate}
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Генерируем…" : "Сгенерировать QR"}
        </button>
        <a
          href={`/print/qr?count=${count}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          🖨 Файл для типографии
        </a>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground print:hidden">
          QR подписаны секретным ключом — номер стола нельзя подменить в ссылке.
          Сгенерируй, распечатай и наклей на столы.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.num}
              className="flex break-inside-avoid flex-col items-center rounded-2xl border border-border bg-white p-4 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.qr} alt={tableLabel(it.num)} className="w-full" />
              <div className="mt-2 font-heading text-lg text-[#1a1611]">
                {tableLabel(it.num)}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1611]/50">
                Сазанчик · меню
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
