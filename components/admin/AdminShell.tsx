"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SazanFish } from "@/components/icons/SazanFish";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  { href: "/admin", label: "Меню" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/reservations", label: "Брони" },
  { href: "/admin/tables", label: "Столы" },
  { href: "/admin/football", label: "Футбол" },
  { href: "/admin/staff", label: "Персонал" },
  { href: "/admin/staff-shifts", label: "Смены (PIN)" },
  { href: "/admin/finance", label: "Финансы" },
  { href: "/admin/cash", label: "Касса" },
  { href: "/admin/payroll", label: "Зарплаты" },
  { href: "/admin/shifts", label: "Смены" },
  { href: "/admin/inventory", label: "Склад" },
  { href: "/admin/recipes", label: "Рецепты" },
  { href: "/admin/restaurant", label: "Ресторан" },
  { href: "/admin/story", label: "История" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page renders bare — no authenticated chrome
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
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

          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-full px-3 py-1.5 transition-colors " +
                    (active
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              ↗ Сайт
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
