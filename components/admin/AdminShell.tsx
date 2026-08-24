"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SazanFish } from "@/components/icons/SazanFish";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type NavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Обзор",
    items: [{ href: "/admin", label: "Дашборд" }],
  },
  {
    label: "Меню",
    items: [
      { href: "/admin/menu", label: "Меню" },
      { href: "/admin/categories", label: "Категории" },
    ],
  },
  {
    label: "Заказы",
    items: [
      { href: "/admin/reservations", label: "Брони" },
      { href: "/admin/reviews", label: "Отзывы" },
      { href: "/admin/tables", label: "Столы" },
    ],
  },
  {
    label: "Персонал",
    items: [
      { href: "/admin/staff", label: "Персонал" },
      { href: "/admin/staff-shifts", label: "Смены (PIN)" },
      { href: "/admin/shifts", label: "Смены (HR)" },
    ],
  },
  {
    label: "Финансы",
    items: [
      { href: "/admin/finance", label: "Прибыль" },
      { href: "/admin/cash", label: "Счета" },
      { href: "/admin/payroll", label: "Зарплаты" },
      { href: "/admin/audit", label: "Журнал" },
    ],
  },
  {
    label: "Склад",
    items: [
      { href: "/admin/inventory", label: "Склад" },
      { href: "/admin/recipes", label: "Рецепты" },
    ],
  },
  {
    label: "Настройки",
    items: [
      { href: "/admin/football", label: "Футбол" },
      { href: "/admin/restaurant", label: "Ресторан" },
      { href: "/admin/story", label: "История" },
    ],
  },
];

const FLAT_NAV = NAV_GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return (
      <div className="admin-shell min-h-screen bg-background">
        {children}
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-background">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-40 border-b border-border bg-card/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <SazanFish className="h-7 w-auto text-gold" />
            <div className="leading-none">
              <div className="font-heading text-lg">
                <span className="italic text-gold">С</span>азанчик
              </div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                admin
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {FLAT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "shrink-0 rounded-full px-3 py-1.5 transition-colors " +
                  (isActive(pathname, item.href)
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Tablet nav — grouped dropdown */}
          <div className="hidden md:block lg:hidden">
            <select
              value={pathname}
              onChange={(e) => {
                if (e.target.value) window.location.href = e.target.value;
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60"
            >
              {NAV_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <option key={item.href} value={item.href}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold sm:block"
            >
              ↗ Сайт
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Мобильный шит «Ещё» — сгруппированные разделы плиткой */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="fixed bottom-0 left-0 right-0 z-50 max-h-[78vh] overflow-y-auto rounded-t-3xl border-t border-gold/25 bg-card px-4 pb-24 pt-3 shadow-2xl md:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.3em] text-gold">
                  — {group.label} —
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm transition-colors",
                        isActive(pathname, item.href)
                          ? "border-gold/60 bg-gold/10 text-gold"
                          : "border-border text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link
              href="/"
              target="_blank"
              className="block rounded-xl border border-border px-3 py-2.5 text-center text-sm text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              ↗ Открыть сайт
            </Link>
          </nav>
        </>
      )}

      {/* Мобильный нижний таб-бар: главное всегда под пальцем */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 pb-safe-1 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5">
          {[
            { href: "/admin", icon: "◆", label: "Обзор" },
            { href: "/admin/menu", icon: "🍽", label: "Меню" },
            { href: "/admin/reservations", icon: "📅", label: "Брони" },
            { href: "/admin/finance", icon: "📊", label: "Финансы" },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                isActive(pathname, t.href) && !mobileOpen
                  ? "text-gold"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-base leading-none" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </Link>
          ))}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px]",
              mobileOpen ? "text-gold" : "text-muted-foreground"
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              ☰
            </span>
            Ещё
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
        {children}
      </main>
    </div>
  );
}
