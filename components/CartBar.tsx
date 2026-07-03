"use client";

import { useCart } from "@/lib/cart-context";
import { writeLocal } from "@/lib/local-store";
import { useLocale, t, formatPrice, UI_STRINGS } from "@/lib/i18n";
import { useTableNumber } from "@/lib/table";
import { getRecommendations } from "@/lib/pairings";
import { useMenuOptional } from "@/lib/menu-context";
import { cn } from "@/lib/utils";
import { enqueueOrder } from "@/lib/order-queue";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

function safeRandomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function CartBar() {
  const { locale } = useLocale();
  const {
    lines,
    totalItems,
    subtotal,
    discount,
    total,
    service,
    isBirthday,
    setBirthday,
    isOpen,
    setOpen,
    inc,
    dec,
    clear,
    add,
  } = useCart();
  const { table, tableToken, setTable } = useTableNumber();
  const [placing, startTransition] = useTransition();
  const [placed, setPlaced] = useState(false);

  // Bump the bar when item count grows (premium tactile feedback)
  const prevCount = useRef(totalItems);
  const [bump, setBump] = useState(false);
  // Idempotency: same key across retries of one attempt, reset after success.
  const idemRef = useRef<string | null>(null);
  useEffect(() => {
    if (totalItems > prevCount.current) {
      setBump(true);
      const id = setTimeout(() => setBump(false), 540);
      prevCount.current = totalItems;
      return () => clearTimeout(id);
    }
    prevCount.current = totalItems;
  }, [totalItems]);

  const menu = useMenuOptional()?.menu;

  const recommendations = useMemo(() => {
    if (!menu || lines.length === 0) return [];
    const itemIds = new Set(lines.map((l) => l.id));
    const catIds = new Set<string>();
    for (const cat of menu) {
      for (const item of cat.items) {
        if (itemIds.has(item.id)) catIds.add(cat.id);
      }
    }
    return getRecommendations(menu, itemIds, catIds, 3);
  }, [lines, menu]);

  const placeOrder = () => {
    if (lines.length === 0) return;
    const t1 = table;
    if (!t1) {
      toast.error("Укажите номер стола");
      return;
    }

    // Optimistic: close cart, show a "sending" state — the success toast
    // only fires once the server actually confirms the order (below).
    setOpen(false);
    setPlaced(true);

    idemRef.current ??= safeRandomId();

    const orderBody = {
      tableNumber: t1,
      tableToken: tableToken ?? undefined,
      idempotencyKey: idemRef.current ?? undefined,
      isBirthday: isBirthday || undefined,
      lines: lines.map((l) => ({
        id: l.id,
        variantKey: l.variantKey,
        qty: l.qty,
        price: l.price,
        name: l.name,
        variantLabel: l.variantLabel,
      })),
      subtotal,
      service,
      total,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderBody),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? "Ошибка при создании заказа");
          return;
        }

        const order = await res.json();
        clear();
        idemRef.current = null; // success → next order gets a fresh key

        // Remember the order so the guest can track its live status.
        // writeLocal notifies OrderTracker through the shared store.
        writeLocal(
          "sazanchik:lastOrder",
          JSON.stringify({ id: order.id, table: t1, at: Date.now() })
        );

        toast.success(`Заказ #${order.id.slice(0, 8)} принят!`, {
          description: "Официант скоро подойдёт.",
        });
      } catch (err) {
        // Likely offline → queue it; the same idempotencyKey makes resend safe.
        console.error("Order placement failed (queuing):", err);
        enqueueOrder(orderBody);
        clear();
        idemRef.current = null;
        toast.success("Нет сети — заказ сохранён", {
          description: "Отправим автоматически, как появится интернет.",
        });
      } finally {
        setPlaced(false);
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-4 right-4 bottom-safe-4 z-40 transition-all duration-500 md:left-1/2 md:right-auto md:bottom-8 md:-translate-x-1/2 md:w-[480px]",
          totalItems > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-32 opacity-0 pointer-events-none"
        )}
      >
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-full border border-gold/30 bg-card/95 px-4 py-3 backdrop-blur-md shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] hover:border-gold/60 transition-colors",
            bump && "cart-bump"
          )}
        >
          <span className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6 text-gold">
              <path d="M3 6h2l2 13h11l2-10H7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="22" r="1.5" />
              <circle cx="17" cy="22" r="1.5" />
            </svg>
            <span
              key={totalItems}
              className="badge-pop absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold tabular-nums text-primary-foreground"
            >
              {totalItems}
            </span>
          </span>

          <span className="flex-1 text-left">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {placed
                ? "Заказ отправляется…"
                : t(UI_STRINGS.cart_title, locale)}
            </span>
            <span className="block font-heading text-base text-gold tabular-nums">
              {placing ? "Отправка…" : formatPrice(total, locale)}
            </span>
          </span>

          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 text-muted-foreground group-hover:text-foreground">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] border-t border-gold/20 bg-card sm:max-w-2xl sm:mx-auto sm:rounded-t-2xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-2xl">
              {t(UI_STRINGS.cart_title, locale)}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {totalItems > 0
                ? `${totalItems} ${t(UI_STRINGS.cart_items, locale).toLowerCase()}${table ? ` · ${t(UI_STRINGS.table, locale)} #${table}` : ""}`
                : t(UI_STRINGS.cart_empty, locale)}
            </SheetDescription>
          </SheetHeader>

          {lines.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t(UI_STRINGS.cart_empty, locale)}
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto px-1 pb-4 pt-2">
              {lines.map((line) => (
                <div
                  key={`${line.id}-${line.variantKey ?? ""}`}
                  className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-tight">{t(line.name, locale)}</div>
                    {line.variantLabel && (
                      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {t(line.variantLabel, locale)}
                      </div>
                    )}
                    <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {formatPrice(line.price, locale)} × {line.qty} ={" "}
                      <span className="text-gold">
                        {formatPrice(line.price * line.qty, locale)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-full border border-border bg-background/60 px-1 py-1">
                    <button
                      onClick={() => dec(line.id, line.variantKey)}
                      className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="−"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm tabular-nums">
                      {line.qty}
                    </span>
                    <button
                      onClick={() => inc(line.id, line.variantKey)}
                      className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="+"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {recommendations.length > 0 && (
                <div className="mt-4 rounded-xl border border-gold/15 bg-gold/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
                    <span className="h-px flex-1 bg-gold/30" />
                    {t(UI_STRINGS.recommended, locale)}
                    <span className="h-px flex-1 bg-gold/30" />
                  </div>
                  <div className="space-y-1">
                    {recommendations.map((r) => (
                      <button
                        key={r.id}
                        onClick={() =>
                          add({ id: r.id, price: r.price, name: r.name })
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gold/5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm leading-tight">
                            {t(r.name, locale)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t(r.categoryName, locale)}
                          </div>
                        </div>
                        <span className="font-heading text-sm tabular-nums text-gold">
                          {formatPrice(r.price, locale)}
                        </span>
                        <span className="flex size-6 items-center justify-center rounded-full border border-gold/40 text-gold">
                          +
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-1 rounded-xl border border-border/60 bg-background/40 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t(UI_STRINGS.cart_total, locale)}</span>
                  <span className="tabular-nums">
                    {formatPrice(subtotal, locale)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gold">
                    <span>🎂 Скидка именинника −10%</span>
                    <span className="tabular-nums">
                      −{formatPrice(discount, locale)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t(UI_STRINGS.cart_service, locale)}</span>
                  <span className="tabular-nums">{formatPrice(service, locale)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border/50 pt-2 font-heading text-lg">
                  <span>{t(UI_STRINGS.cart_total, locale)}</span>
                  <span className="tabular-nums text-gold">
                    {formatPrice(total, locale)}
                  </span>
                </div>
              </div>

              {/* Birthday −10% */}
              <button
                type="button"
                onClick={() => setBirthday(!isBirthday)}
                aria-pressed={isBirthday}
                className={cn(
                  "mt-3 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  isBirthday
                    ? "border-gold/50 bg-gold/[0.06]"
                    : "border-border bg-background/40 hover:border-gold/30"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    isBirthday
                      ? "border-gold bg-gold text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isBirthday && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span>
                  <span className="block text-sm">🎂 У меня день рождения — скидка 10%</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Официант подтвердит по документу
                  </span>
                </span>
              </button>

              {/* Table number — required to place the order. Once verified by
                  a scanned QR token, it's locked: free-text edits would
                  silently discard the signature that proves the guest is
                  actually at that table. */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-3">
                <span className="text-sm">
                  <span className="font-heading text-base">
                    {t(UI_STRINGS.table, locale)}
                  </span>
                  {!table && (
                    <span className="ml-2 text-[11px] text-gold">
                      укажите номер
                    </span>
                  )}
                  {tableToken && (
                    <span className="ml-2 text-[11px] text-emerald-400">
                      ✓ по QR-коду
                    </span>
                  )}
                </span>
                {tableToken ? (
                  <span className="flex items-center gap-2">
                    <span className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-center font-heading text-lg tabular-nums">
                      {table}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Изменить номер стола вручную? Используйте, только если вы не за этим столом."
                          )
                        ) {
                          setTable(null);
                        }
                      }}
                      className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      изм.
                    </button>
                  </span>
                ) : (
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={table ?? ""}
                    onChange={(e) =>
                      setTable(e.target.value.trim() ? e.target.value.trim() : null)
                    }
                    placeholder="№"
                    className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-center font-heading text-lg tabular-nums outline-none focus:border-gold/60"
                  />
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => clear()}
                  disabled={placing}
                  className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  {t(UI_STRINGS.cart_clear, locale)}
                </button>
                <button
                  onClick={placeOrder}
                  disabled={placing || lines.length === 0 || !table}
                  className="flex-1 rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  {placing
                    ? "Отправка…"
                    : !table
                      ? "Укажите стол ↑"
                      : t(UI_STRINGS.cart_call_waiter, locale)}
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
