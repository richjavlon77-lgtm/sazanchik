"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SazanFish } from "@/components/icons/SazanFish";
import { t, formatPrice, UI_STRINGS } from "@/lib/i18n-core";
import { hasVariants, lowestPrice, type TvSlide } from "@/lib/tv-slides";
import type { Locale, Localized, MenuItem, RestaurantInfo } from "@/types/menu";

const TV_STRINGS = {
  from: { ru: "от", uz: "dan", en: "from", tr: "başlangıç" },
  qr_hint: {
    ru: "QR-код на столе — закажите прямо с телефона",
    uz: "Stoldagi QR-kod — telefoningizdan buyurtma bering",
    en: "Scan the QR code on your table — order from your phone",
    tr: "Masanızdaki QR kodu okutun — telefonunuzdan sipariş verin",
  },
  football: {
    ru: "Смотрим футбол у нас",
    uz: "Futbolni biznikida ko'ring",
    en: "Watch football with us",
    tr: "Futbolu bizimle izleyin",
  },
  live: { ru: "Прямая трансляция", uz: "Jonli efir", en: "Live", tr: "Canlı" },
  page: { ru: "стр.", uz: "b.", en: "page", tr: "s." },
  empty: {
    ru: "Меню пока пустое",
    uz: "Menyu hozircha bo'sh",
    en: "The menu is empty",
    tr: "Menü şu anda boş",
  },
} satisfies Record<string, Localized>;

const REFRESH_MS = 15 * 60 * 1000; // pick up admin edits without touching the PC

type Props = {
  slides: TvSlide[];
  restaurant: RestaurantInfo;
  locale: Locale;
  intervalSec: number;
  theme: "light" | "dark";
};

export function TvScreen({
  slides,
  restaurant,
  locale,
  intervalSec,
  theme,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const [clock, setClock] = useState("");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;
  const slide: TvSlide | undefined = slides[safeIndex];

  const go = useCallback(
    (step: number) => {
      if (count === 0) return;
      setIndex((i) => (i + step + count) % count);
    },
    [count]
  );

  /* Auto-advance — the timer restarts on every slide change, so manual
     navigation always gets a full interval. */
  useEffect(() => {
    if (paused || count < 2) return;
    const id = setTimeout(() => go(1), intervalSec * 1000);
    return () => clearTimeout(id);
  }, [safeIndex, paused, count, intervalSec, go]);

  /* Keyboard: ← → навигация, пробел — пауза, F — полный экран */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key.toLowerCase() === "f") void toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /* Controls + cursor appear on mouse move, then fade away again */
  useEffect(() => {
    const wake = () => {
      setUiVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setUiVisible(false), 3500);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  /* Keep the screen awake — a signage display must never sleep */
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    type WakeLockApi = { request: (type: "screen") => Promise<Sentinel> };
    const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!api) return;

    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const s = await api.request("screen");
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        /* denied (not fullscreen / unsupported) — harmless */
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, []);

  /* Clock (Tashkent) — also proves to staff the screen is alive */
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tashkent",
    });
    const tick = () => setClock(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);

  /* Refresh server data periodically so menu edits reach the screen */
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const service = t(UI_STRINGS.cart_service, locale);

  if (!slide) {
    return (
      <div className="tv-root" data-tv-theme={theme}>
        <div className="tv-slide tv-empty">
          <SazanFish className="tv-brand-fish" />
          <p>{t(TV_STRINGS.empty, locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tv-root${uiVisible ? " is-active" : ""}`}
      data-tv-theme={theme}
      data-slide={slide.kind}
    >
      {/* Slide timer */}
      <div className="tv-progress" aria-hidden>
        <i
          key={safeIndex}
          style={{
            animationDuration: `${intervalSec}s`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>

      <div className="tv-stage">
        <div className="tv-slide" key={`${slide.id}-${safeIndex}`}>
          {slide.kind === "brand" && (
            <BrandSlide restaurant={restaurant} locale={locale} />
          )}
          {slide.kind === "feature" && (
            <FeatureSlide slide={slide} locale={locale} />
          )}
          {slide.kind === "list" && <ListSlide slide={slide} locale={locale} />}
          {slide.kind === "events" && (
            <EventsSlide slide={slide} locale={locale} />
          )}
        </div>
      </div>

      {/* Clock */}
      <div className="tv-corner tv-corner-top">
        <span className="tv-clock">{clock}</span>
      </div>

      {/* Permanent footer line */}
      <div className="tv-corner tv-corner-bottom">
        <span className="tv-hint">{t(TV_STRINGS.qr_hint, locale)}</span>
        <span>
          <b>{restaurant.phone}</b>
          {restaurant.instagram ? ` · ${restaurant.instagram}` : ""} · {service}
        </span>
      </div>

      {/* Hidden operator controls */}
      <div className={`tv-controls${uiVisible ? " is-visible" : ""}`}>
        <button type="button" onClick={() => go(-1)} aria-label="Назад">
          ‹
        </button>
        <button type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶" : "❚❚"}
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Вперёд">
          ›
        </button>
        <span className="tv-counter">
          {safeIndex + 1} / {count}
        </span>
        <button type="button" onClick={() => void toggleFullscreen()}>
          Полный экран
        </button>
      </div>
    </div>
  );
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    /* browser refused — nothing to do */
  }
}

/* ---------------------------------------------------------------- slides */

function Ornament() {
  return (
    <div className="tv-rule" aria-hidden>
      <span />
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M24 6 L 27 21 L 42 24 L 27 27 L 24 42 L 21 27 L 6 24 L 21 21 Z" />
        <circle cx="24" cy="24" r="1.5" fill="currentColor" />
      </svg>
      <span />
    </div>
  );
}

function BrandSlide({
  restaurant,
  locale,
}: {
  restaurant: RestaurantInfo;
  locale: Locale;
}) {
  const name = restaurant.name.replace(/\s*CITY$/i, "");
  return (
    <div className="tv-brand">
      <SazanFish className="tv-brand-fish" />
      <h1 className="tv-brand-name">
        <em>{name.slice(0, 1)}</em>
        {name.slice(1)}
        <span className="tv-brand-city">City</span>
      </h1>
      <Ornament />
      <p className="tv-brand-tagline">{t(restaurant.tagline, locale)}</p>
      <div className="tv-brand-meta">
        <span>
          <strong>{t(restaurant.workingHours, locale)}</strong>
        </span>
        <span>{t(restaurant.address, locale)}</span>
        <span>
          <strong>{restaurant.phone}</strong>
        </span>
      </div>
      <div className="tv-brand-hint">
        <span className="tv-dot" />
        <span>{t(TV_STRINGS.qr_hint, locale)}</span>
      </div>
    </div>
  );
}

function Price({ item, locale }: { item: MenuItem; locale: Locale }) {
  const from = hasVariants(item.price);
  return (
    <>
      {from && <span className="tv-from">{t(TV_STRINGS.from, locale)}</span>}
      {formatPrice(lowestPrice(item.price), locale)}
    </>
  );
}

function ListSlide({
  slide,
  locale,
}: {
  slide: Extract<TvSlide, { kind: "list" }>;
  locale: Locale;
}) {
  const twoCols = slide.items.length > 5;
  const rows = Math.ceil(slide.items.length / 2);
  const withDesc = slide.items.length <= 6;

  return (
    <div className="tv-list">
      <div className="tv-watermark" aria-hidden>
        {String(slide.number).padStart(2, "0")}
      </div>

      <div className="tv-list-head">
        <div className="tv-eyebrow">
          <span className="tv-eyebrow-line" />
          <span>
            {t(UI_STRINGS.menu, locale)}
            {slide.parts > 1
              ? ` · ${t(TV_STRINGS.page, locale)} ${slide.part}/${slide.parts}`
              : ""}
          </span>
        </div>
        <h2 className="tv-list-title">{t(slide.categoryName, locale)}</h2>
        <div className="tv-hairline" />
        {slide.intro && slide.part === 1 && (
          <p className="tv-list-intro">{t(slide.intro, locale)}</p>
        )}
      </div>

      <div
        className={`tv-rows${twoCols ? " is-two" : ""}`}
        style={twoCols ? ({ "--tv-rows": rows } as React.CSSProperties) : undefined}
      >
        {slide.items.map((item, i) => (
          <div
            className="tv-row"
            key={item.id}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="tv-row-line">
              <span className="tv-row-name">
                {t(item.name, locale)}
                {item.weight && (
                  <span className="tv-row-weight"> · {item.weight}</span>
                )}
              </span>
              <span className="tv-dots" aria-hidden />
              <span className="tv-row-price">
                <Price item={item} locale={locale} />
              </span>
            </div>
            {withDesc && item.description && (
              <p className="tv-row-desc">{t(item.description, locale)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureSlide({
  slide,
  locale,
}: {
  slide: Extract<TvSlide, { kind: "feature" }>;
  locale: Locale;
}) {
  const { item } = slide;
  return (
    <div className="tv-feature">
      <div className="tv-feature-photo">
        {/* Plain <img>: sources are DB uploads (/api/img/…) and local files,
            already sized for the web — the optimizer adds nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={t(item.name, locale)} />
        <div className="tv-feature-fade" aria-hidden />
      </div>

      <div className="tv-feature-body">
        <div className="tv-eyebrow">
          <span className="tv-eyebrow-line" />
          <span>
            {t(UI_STRINGS.chef, locale)} · {t(slide.categoryName, locale)}
          </span>
        </div>
        <h2 className="tv-feature-name">{t(item.name, locale)}</h2>
        {item.description && (
          <p className="tv-feature-desc">{t(item.description, locale)}</p>
        )}
        <div className="tv-feature-price">
          <Price item={item} locale={locale} />
        </div>
        <div className="tv-feature-meta">
          {item.weight && <span>{item.weight}</span>}
          {item.calories ? <span>{item.calories} ккал</span> : null}
        </div>
      </div>
    </div>
  );
}

function EventsSlide({
  slide,
  locale,
}: {
  slide: Extract<TvSlide, { kind: "events" }>;
  locale: Locale;
}) {
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tashkent",
      }),
    [locale]
  );

  return (
    <div className="tv-events">
      <div className="tv-eyebrow">
        <span className="tv-eyebrow-line" />
        <span>{t(TV_STRINGS.live, locale)}</span>
      </div>
      <h2 className="tv-events-title">⚽ {t(TV_STRINGS.football, locale)}</h2>
      <div className="tv-hairline" />
      <div>
        {slide.matches.map((m, i) => (
          <div className="tv-match" key={m.id} style={{ "--i": i } as React.CSSProperties}>
            <span className="tv-match-teams">
              {m.homeTeam} — {m.awayTeam}
            </span>
            {m.league && <span className="tv-match-league">{m.league}</span>}
            <span className="tv-match-when">{fmt.format(new Date(m.startsAt))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
