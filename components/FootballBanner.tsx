"use client";

import { useLocale, t } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";

export type MatchItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string; // ISO
  league: string | null;
  note: string | null;
};

const TITLE = { ru: "Смотри матч у нас", uz: "Matchni biznikida ko‘r", en: "Watch the match here" };
const SUB = {
  ru: "Большой экран · уютная атмосфера · вкусная кухня",
  uz: "Katta ekran · qulay muhit · mazali taomlar",
  en: "Big screen · cozy vibe · great food",
};

function when(iso: string, locale: string) {
  return new Date(iso).toLocaleString(
    locale === "en"
      ? "en-GB"
      : locale === "uz"
        ? "uz-UZ"
        : locale === "tr"
          ? "tr-TR"
          : "ru-RU",
    {
      timeZone: "Asia/Tashkent",
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export function FootballBanner({ matches }: { matches: MatchItem[] }) {
  const { locale } = useLocale();
  if (matches.length === 0) return null;

  return (
    <section className="pt-12">
      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/[0.07] to-transparent p-5 md:p-7">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
            <span>⚽</span>
            {t(TITLE, locale)}
          </div>
          <p className="mb-5 text-[13px] text-muted-foreground italic">
            {t(SUB, locale)}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {matches.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/40 p-4"
              >
                <div className="flex items-center justify-center gap-3 text-center font-heading text-lg leading-tight">
                  <span className="flex-1 text-right">{m.homeTeam}</span>
                  <span className="shrink-0 text-xs text-gold">VS</span>
                  <span className="flex-1 text-left">{m.awayTeam}</span>
                </div>
                <div className="text-center text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {when(m.startsAt, locale)}
                  {m.league ? ` · ${m.league}` : ""}
                </div>
                {m.note && (
                  <div className="text-center text-[11px] text-gold/90">
                    {m.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
