import { MENU as STATIC_MENU } from "@/data/menu";
import { applyIntros } from "@/data/category-intros";
import { enrichMenuWithDiet } from "@/lib/auto-diet";
import { getMenuFromDb } from "@/lib/menu-from-db";
import { t, formatPrice } from "@/lib/i18n-core";
import type { Locale, MenuCategory } from "@/types/menu";
import { FishMark, Diamond } from "@/components/print/marks";
import "./print.css";

export const metadata = {
  title: "Сазанчик CITY — Меню для печати",
  description: "Печатная версия меню",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Меню из БД (как на сайте и ТВ) — печать всегда с актуальными ценами.
 *  Статика — только аварийный фолбэк, если БД недоступна. */
async function loadMenu(): Promise<MenuCategory[]> {
  try {
    const dbMenu = await getMenuFromDb();
    if (dbMenu.length > 0) return applyIntros(enrichMenuWithDiet(dbMenu));
  } catch (e) {
    console.error("print: menu from DB failed, falling back to static:", e);
  }
  return applyIntros(enrichMenuWithDiet(STATIC_MENU));
}

/** В админке категории могут называться с эмодзи («🥩 СТЕЙКИ») — на сайте
 *  это уместно, в печатном люкс-меню нет. Чистим только для печати. */
function stripEmoji(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .trim();
}

/** Римская нумерация разделов — I, II, III… */
function roman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

export default function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: Locale }>;
}) {
  return <PrintPageInner searchParams={searchParams} />;
}

async function PrintPageInner({
  searchParams,
}: {
  searchParams: Promise<{ lang?: Locale }>;
}) {
  const params = await searchParams;
  const locale: Locale =
    params.lang === "uz" || params.lang === "en" || params.lang === "tr"
      ? params.lang
      : "ru";

  const MENU_DATA = await loadMenu();

  return (
    <div className="print-root">
      {/* ── Обложка: без логотипа, только знак и слово MENU ── */}
      <section className="print-cover">
        <div className="cover-frame">
          <div className="cover-inner">
            <div className="cover-eyebrow">Restaurant · Tashkent</div>
            <FishMark className="cover-fish" />
            <h1 className="cover-title">Menu</h1>
            <Diamond />
            <p className="cover-tagline">
              В лучших традициях узбекской кухни
              <br />с нотками европейской изысканности
            </p>
          </div>
          <div className="cover-meta">
            Ежедневно 10:00–23:00 · Обслуживание +20%
          </div>
        </div>
      </section>

      {/* ── Карта меню ── */}
      <section className="print-toc">
        <header>
          <h2>Карта меню</h2>
          <Diamond />
        </header>
        <ol>
          {MENU_DATA.map((cat, i) => (
            <li key={cat.id}>
              <span className="toc-num">{roman(i + 1)}</span>
              <span className="toc-name">{stripEmoji(t(cat.name, locale))}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Разделы: каждый с новой страницы ── */}
      {MENU_DATA.map((cat, i) => (
        <section key={cat.id} className="print-section">
          <header>
            <div className="sec-num">{roman(i + 1)}</div>
            <h2>{stripEmoji(t(cat.name, locale))}</h2>
            <Diamond />
            {cat.intro && <p className="intro">{t(cat.intro, locale)}</p>}
          </header>

          <ul>
            {cat.items.map((item) => {
              const isVariants = Array.isArray(item.price);
              return (
                <li key={item.id}>
                  <div className="dish-name">{t(item.name, locale)}</div>
                  {item.description && (
                    <p className="desc">{t(item.description, locale)}</p>
                  )}
                  {isVariants ? (
                    <ul className="variants">
                      {(
                        item.price as { label: typeof item.name; price: number }[]
                      ).map((v, j) => (
                        <li key={j}>
                          <span className="vlabel">{t(v.label, locale)}</span>
                          <span className="vprice">
                            {formatPrice(v.price, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="price">
                      {formatPrice(item.price as number, locale)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className="print-footer">
        <Diamond />
        <p>Приятного аппетита</p>
      </footer>
    </div>
  );
}
