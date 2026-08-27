"use client";

import { useMemo, useState } from "react";
import { writeLocal, useLocalString } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import type { MenuCategory, MenuItem, Localized } from "@/types/menu";
import { getRecommendations } from "@/lib/pairings";

/**
 * Приложение доставки (мини-апп из Telegram-бота и /delivery).
 * Контур без зала: никакого официанта, столов и сервис-чарджа —
 * блюда → корзина → телефон+адрес → заявка менеджеру.
 */

type CartLine = { slug: string; name: string; price: number; qty: number };

const CART_KEY = "sazanchik:deliveryCart";
const LAST_ORDER_KEY = "sazanchik:lastDelivery";
const ru = (v: Localized | undefined) => v?.ru ?? "";
const money = (n: number) => `${n.toLocaleString("ru-RU")} сум`;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

function useCartLines(): CartLine[] {
  const raw = useLocalString(CART_KEY);
  return useMemo(() => {
    try {
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
}

const saveCart = (lines: CartLine[]) =>
  writeLocal(CART_KEY, JSON.stringify(lines));

function bump(lines: CartLine[], key: { slug: string; price: number }, delta: number, name?: string): CartLine[] {
  const i = lines.findIndex((l) => l.slug === key.slug && l.price === key.price);
  if (i === -1) {
    if (delta <= 0 || !name) return lines;
    return [...lines, { slug: key.slug, price: key.price, name, qty: delta }];
  }
  return lines
    .map((l, idx) => (idx === i ? { ...l, qty: l.qty + delta } : l))
    .filter((l) => l.qty > 0);
}

/**
 * Допродажи «к этому берут»: сперва кураторские пары (lib/pairings),
 * при нехватке — добор недорогих позиций из категорий-компаньонов
 * (салаты/напитки/хлеб), которых ещё нет в корзине.
 */
function buildUpsell(menu: MenuCategory[], lines: CartLine[], limit = 4) {
  const inCart = new Set(lines.map((l) => l.slug));
  const cartCats = new Set<string>();
  for (const c of menu) {
    if (c.items.some((i) => inCart.has(i.id))) cartCats.add(c.id);
  }

  const picks: { item: MenuItem; price: number }[] = [];
  const seen = new Set<string>();
  const push = (item: MenuItem) => {
    if (inCart.has(item.id) || seen.has(item.id)) return;
    const price = Array.isArray(item.price)
      ? Math.min(...item.price.map((v) => v.price))
      : (item.price as number);
    seen.add(item.id);
    picks.push({ item, price });
  };

  // 1) кураторские пары
  for (const r of getRecommendations(menu, inCart, cartCats, limit)) {
    for (const c of menu) {
      const item = c.items.find((i) => i.id === r.id);
      if (item) push(item);
    }
  }
  // 2) добор из компаньонов — дешёвые и по возможности с фото
  if (picks.length < limit) {
    const companions = menu.filter((c) =>
      /салат|напит|лимонад|фреш|чай|хлеб/i.test(c.name.ru ?? "")
    );
    const pool = companions
      .flatMap((c) => c.items)
      .filter((i) => !Array.isArray(i.price))
      .sort(
        (a, b) =>
          Number(!!b.image) - Number(!!a.image) ||
          (a.price as number) - (b.price as number)
      );
    for (const item of pool) {
      if (picks.length >= limit) break;
      push(item);
    }
  }
  return picks.slice(0, limit);
}

// ── Кнопка +/− у блюда ──────────────────────────────────────────

function QtyButton({
  qty,
  onAdd,
  onRemove,
}: {
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  if (!qty) {
    return (
      <button
        onClick={onAdd}
        aria-label="Добавить"
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-lg leading-none text-gold transition-all hover:bg-gold hover:text-primary-foreground active:scale-90"
      >
        +
      </button>
    );
  }
  return (
    <span className="flex h-8 shrink-0 items-center rounded-full bg-gold text-primary-foreground">
      <button onClick={onRemove} aria-label="Убрать" className="px-2.5 text-lg leading-none active:scale-90">
        −
      </button>
      <span className="min-w-4 text-center text-sm tabular-nums">{qty}</span>
      <button onClick={onAdd} aria-label="Добавить" className="px-2.5 text-lg leading-none active:scale-90">
        +
      </button>
    </span>
  );
}

// ── Карточка блюда ──────────────────────────────────────────────

function DishRow({
  item,
  lines,
  onChange,
}: {
  item: MenuItem;
  lines: CartLine[];
  onChange: (l: CartLine[]) => void;
}) {
  const variants = Array.isArray(item.price)
    ? item.price.map((v) => ({ label: ru(v.label), price: v.price }))
    : null;

  const qtyOf = (price: number) =>
    lines.find((l) => l.slug === item.id && l.price === price)?.qty ?? 0;

  const nameFor = (label?: string) => (label ? `${ru(item.name)} (${label})` : ru(item.name));

  return (
    <article className="flex gap-3 border-b border-border/50 py-4 last:border-0">
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="size-[72px] shrink-0 rounded-2xl object-cover shadow-[0_8px_24px_-12px_rgba(23,21,15,0.4)]"
        />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-[16px] leading-tight">{ru(item.name)}</h3>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
            {ru(item.description)}
          </p>
        )}

        {variants ? (
          <div className="mt-2 space-y-1.5">
            {variants.map((v) => (
              <div key={v.price} className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {v.label}
                </span>
                <span className="ml-auto font-heading text-sm tabular-nums text-gold">
                  {money(v.price)}
                </span>
                <QtyButton
                  qty={qtyOf(v.price)}
                  onAdd={() => onChange(bump(lines, { slug: item.id, price: v.price }, 1, nameFor(v.label)))}
                  onRemove={() => onChange(bump(lines, { slug: item.id, price: v.price }, -1))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-heading tabular-nums text-gold">
              {money(item.price as number)}
            </span>
            <QtyButton
              qty={qtyOf(item.price as number)}
              onAdd={() => onChange(bump(lines, { slug: item.id, price: item.price as number }, 1, nameFor()))}
              onRemove={() => onChange(bump(lines, { slug: item.id, price: item.price as number }, -1))}
            />
          </div>
        )}
      </div>
    </article>
  );
}

// ── Чекаут ──────────────────────────────────────────────────────

function Checkout({
  lines,
  menu,
  terms,
  onBack,
  onDone,
}: {
  lines: CartLine[];
  menu: MenuCategory[];
  terms: DeliveryTerms;
  onBack: () => void;
  onDone: () => void;
}) {
  const upsell = useMemo(() => buildUpsell(menu, lines), [menu, lines]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const freeDelivery = terms.freeFrom != null && total >= terms.freeFrom;
  const fee = terms.fee != null && !freeDelivery ? terms.fee : 0;
  const belowMin = terms.minOrder != null && total < terms.minOrder;

  const submit = async () => {
    if (!PHONE_RE.test(phone.trim())) {
      setError("Укажите телефон — менеджер подтвердит заказ звонком");
      return;
    }
    if (address.trim().length < 5) {
      setError("Укажите адрес подробнее, чтобы курьер вас нашёл");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/delivery-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          address: address.trim(),
          comment: comment.trim(),
          lines: lines.map((l) => ({ slug: l.slug, price: l.price, qty: l.qty })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Не получилось отправить — попробуйте ещё раз");
        return;
      }
      try {
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(lines));
      } catch {
        /* необязательно */
      }
      saveCart([]);
      onDone();
    } catch {
      setError("Нет сети — попробуйте ещё раз");
    } finally {
      setSending(false);
    }
  };

  const input =
    "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50";

  return (
    <div className="mx-auto max-w-lg px-4 pb-10">
      <button onClick={onBack} className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        ‹ К меню
      </button>
      <h2 className="mt-3 font-heading text-3xl">Ваш заказ</h2>

      <div className="mt-4 rounded-3xl border border-gold/20 bg-card/40 p-4">
        {lines.map((l, i) => (
          <div key={i} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
            <span className="min-w-0 flex-1">{l.name} ×{l.qty}</span>
            <span className="font-heading tabular-nums text-gold">{money(l.price * l.qty)}</span>
          </div>
        ))}
        {terms.fee != null && (
          <div className="mt-1 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Доставка</span>
            <span className={freeDelivery ? "text-emerald-600" : "tabular-nums"}>
              {freeDelivery ? "бесплатно 🎉" : money(fee)}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-border/60 pt-3">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Итого</span>
          <span className="font-heading text-xl tabular-nums text-gold">{money(total + fee)}</span>
        </div>
        {terms.fee == null && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Стоимость доставки сообщит менеджер при подтверждении.
          </p>
        )}
        {!freeDelivery && terms.freeFrom != null && terms.fee != null && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Бесплатная доставка от {money(terms.freeFrom)} — не хватает{" "}
            {money(terms.freeFrom - total)}
          </p>
        )}
      </div>

      {/* Допродажи: к этому берут */}
      {upsell.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">
            — К этому берут —
          </div>
          <div className="scrollbar-none -mx-4 mt-2 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {upsell.map(({ item, price }) => (
              <button
                key={item.id}
                onClick={() =>
                  saveCart(
                    bump(lines, { slug: item.id, price }, 1, item.name.ru ?? item.id)
                  )
                }
                className="w-36 shrink-0 rounded-2xl border border-border bg-white/70 p-2.5 text-left transition-colors hover:border-gold/60"
              >
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="mb-2 h-20 w-full rounded-xl object-cover"
                  />
                )}
                <div className="line-clamp-2 text-xs leading-snug">
                  {item.name.ru}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-heading text-sm tabular-nums text-gold">
                    {money(price)}
                  </span>
                  <span className="flex size-6 items-center justify-center rounded-full border border-gold/50 text-sm leading-none text-gold">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон · +998 __ ___ __ __"
          className={input}
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value.slice(0, 300))}
          rows={2}
          placeholder="Адрес: улица, дом, подъезд, ориентир"
          className={cn(input, "resize-none")}
        />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 200))}
          placeholder="Комментарий (необязательно)"
          className={input}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {belowMin && (
        <p className="mt-3 rounded-2xl border border-gold/40 bg-gold/[0.07] px-4 py-2.5 text-sm">
          Минимальный заказ на доставку — {money(terms.minOrder as number)}.
          Добавьте ещё на {money((terms.minOrder as number) - total)} 🙂
        </p>
      )}
      <button
        onClick={submit}
        disabled={sending || belowMin}
        className="mt-4 w-full rounded-full bg-gold py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sending ? "Отправляем…" : `Заказать · ${money(total + fee)}`}
      </button>
    </div>
  );
}

// ── Приложение ──────────────────────────────────────────────────

export type DeliveryTerms = {
  minOrder: number | null;
  fee: number | null;
  freeFrom: number | null;
};

export function DeliveryApp({
  menu,
  terms,
}: {
  menu: MenuCategory[];
  terms: DeliveryTerms;
}) {
  const lines = useCartLines();
  const [screen, setScreen] = useState<"menu" | "checkout" | "done">("menu");
  const [activeCat, setActiveCat] = useState(menu[0]?.id ?? "");
  const [query, setQuery] = useState("");

  // Прошлый заказ — для «повторить в один тап»
  const lastRaw = useLocalString(LAST_ORDER_KEY);
  const lastOrder = useMemo<CartLine[]>(() => {
    try {
      return lastRaw ? (JSON.parse(lastRaw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }, [lastRaw]);

  // Поиск по всему меню (имя блюда, без учёта регистра)
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    const out: { item: MenuItem }[] = [];
    for (const c of menu) {
      for (const item of c.items) {
        if ((item.name.ru ?? "").toLowerCase().includes(q)) out.push({ item });
        if (out.length >= 20) return out;
      }
    }
    return out;
  }, [menu, query]);

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const active = menu.find((c) => c.id === activeCat) ?? menu[0];

  if (screen === "done") {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-background px-6 text-center">
        <div>
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 font-heading text-3xl">Заказ принят!</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Менеджер перезвонит в течение 10 минут, подтвердит сумму и время
            доставки. Спасибо, что выбрали «Сазанчик»! 🐟
          </p>
          <button
            onClick={() => setScreen("menu")}
            className="mt-6 rounded-full border border-gold/50 px-8 py-3 text-xs uppercase tracking-[0.2em] text-gold"
          >
            Заказать ещё
          </button>
        </div>
      </main>
    );
  }

  if (screen === "checkout") {
    return (
      <main className="min-h-[100svh] bg-background">
        <Checkout
          lines={lines}
          menu={menu}
          terms={terms}
          onBack={() => setScreen("menu")}
          onDone={() => setScreen("done")}
        />
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-background pb-28">
      {/* Шапка */}
      <header className="px-4 pt-6 text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
          🚚 Доставка на дом
        </div>
        <h1 className="mt-1 font-heading text-3xl">
          <span className="italic text-gold">С</span>азанчик{" "}
          <span className="text-sm tracking-[0.3em] text-muted-foreground">CITY</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Привезём горячим · менеджер подтвердит заказ звонком
        </p>
        {(terms.minOrder || terms.fee) && (
          <p className="mt-1.5 text-[11px] text-gold">
            {[
              terms.minOrder ? `Мин. заказ ${money(terms.minOrder)}` : "",
              terms.fee
                ? `Доставка ${money(terms.fee)}${terms.freeFrom ? ` · бесплатно от ${money(terms.freeFrom)}` : ""}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </header>

      {/* Поиск по меню */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти блюдо…"
            className="w-full rounded-full border border-border bg-white/70 px-5 py-2.5 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Повторить прошлый заказ */}
        {lastOrder.length > 0 && lines.length === 0 && !query && (
          <button
            onClick={() => saveCart(lastOrder)}
            className="mt-2 w-full rounded-2xl border border-gold/40 bg-gold/[0.07] px-4 py-2.5 text-left text-sm transition-colors hover:border-gold"
          >
            🔁 Повторить прошлый заказ
            <span className="ml-1 text-muted-foreground">
              · {lastOrder.map((l) => l.name.split(" (")[0]).slice(0, 3).join(", ")}
              {lastOrder.length > 3 ? "…" : ""} ·{" "}
            </span>
            <span className="font-heading text-gold">
              {money(lastOrder.reduce((s2, l) => s2 + l.price * l.qty, 0))}
            </span>
          </button>
        )}
      </div>

      {/* Категории */}
      <nav className="scrollbar-none sticky top-0 z-20 mt-4 overflow-x-auto border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur">
        <div className="flex w-max gap-1.5">
          {menu.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCat(c.id);
                window.scrollTo({ top: 0 });
              }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors",
                c.id === active?.id
                  ? "bg-gold text-primary-foreground"
                  : "border border-border text-muted-foreground"
              )}
            >
              {ru(c.name)}
            </button>
          ))}
        </div>
      </nav>

      {/* Результаты поиска или блюда активного раздела */}
      <section className="mx-auto max-w-lg px-4 pt-2">
        {found ? (
          found.length ? (
            found.map(({ item }) => (
              <DishRow key={item.id} item={item} lines={lines} onChange={saveCart} />
            ))
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ничего не нашли по «{query}» 🐟
            </p>
          )
        ) : (
          active?.items.map((item) => (
            <DishRow key={item.id} item={item} lines={lines} onChange={saveCart} />
          ))
        )}
      </section>

      {/* Корзина-бар */}
      {count > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-lg">
          <button
            onClick={() => setScreen("checkout")}
            className="flex w-full items-center justify-between rounded-full bg-gold px-6 py-3.5 text-primary-foreground shadow-[0_12px_40px_-10px_rgba(197,163,92,0.7)] transition-transform active:scale-[0.98]"
          >
            <span className="text-sm font-medium">🛒 {count}</span>
            <span className="text-sm font-semibold uppercase tracking-[0.15em]">
              Оформить доставку
            </span>
            <span className="font-heading tabular-nums">{money(total)}</span>
          </button>
        </div>
      )}
    </main>
  );
}
