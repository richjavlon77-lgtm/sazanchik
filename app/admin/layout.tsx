import Link from "next/link";
import { SazanFish } from "@/components/icons/SazanFish";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata = {
  title: "Админка · Сазанчик CITY",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <SazanFish className="h-7 w-auto text-gold" />
            <div>
              <div className="font-heading text-lg leading-none">
                <span className="italic text-gold">С</span>азанчик
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                admin
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <AdminNavLink href="/admin">Меню</AdminNavLink>
            <AdminNavLink href="/admin/categories">Категории</AdminNavLink>
            <AdminNavLink href="/admin/restaurant">Ресторан</AdminNavLink>
            <AdminNavLink href="/admin/story">История</AdminNavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted hover:text-foreground"
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

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
