import { MENU } from "@/data/menu";
import { applyIntros } from "@/data/category-intros";
import { enrichMenuWithDiet } from "@/lib/auto-diet";
import { t, formatPrice } from "@/lib/i18n-core";
import type { Locale } from "@/types/menu";
import "./print.css";

export const metadata = {
  title: "Сазанчик CITY — Меню для печати",
  description: "Печатная версия меню",
  robots: { index: false, follow: false },
};

const MENU_DATA = applyIntros(enrichMenuWithDiet(MENU));

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

  return (
    <div className="print-root">
      {/* Cover */}
      <section className="print-cover">
        <div className="cover-inner">
          <div className="cover-eyebrow">— Restaurant —</div>
          <h1 className="cover-title">
            <span className="italic">С</span>азанчик
          </h1>
          <div className="cover-sub">— City —</div>
          <div className="cover-line" />
          <p className="cover-tagline">
            В лучших традициях узбекской кухни с нотками европейской изысканности
          </p>
          <div className="cover-line" />
          <p className="cover-meta">Tashkent · Daily 10:00–23:00 · +20% service</p>
        </div>
      </section>

      {MENU_DATA.map((cat) => (
        <section key={cat.id} className="print-section">
          <header>
            <h2>{t(cat.name, locale)}</h2>
            <div className="rule" />
            {cat.intro && <p className="intro">{t(cat.intro, locale)}</p>}
          </header>

          <ul>
            {cat.items.map((item) => {
              const isVariants = Array.isArray(item.price);
              return (
                <li key={item.id}>
                  <div className="line">
                    <span className="name">{t(item.name, locale)}</span>
                    <span className="dots" aria-hidden />
                    {!isVariants && (
                      <span className="price">
                        {formatPrice(item.price as number, locale)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="desc">{t(item.description, locale)}</p>
                  )}
                  {isVariants && (
                    <ul className="variants">
                      {(item.price as { label: typeof item.name; price: number }[]).map(
                        (v, i) => (
                          <li key={i}>
                            <span className="vlabel">{t(v.label, locale)}</span>
                            <span className="vprice">
                              {formatPrice(v.price, locale)}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className="print-footer">
        <p>sazanchik.vercel.app · Меню обновлено {new Date().toLocaleDateString("ru-RU")}</p>
      </footer>
    </div>
  );
}
