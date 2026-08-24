"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { useTableNumber } from "@/lib/table";
import { cn } from "@/lib/utils";

const MAX = 100;

const T = {
  title: {
    ru: "Оцените нас",
    uz: "Bizni baholang",
    en: "Rate us",
    tr: "Bizi değerlendirin",
  },
  subtitle: {
    ru: "Ваше мнение делает «Сазанчик» лучше",
    uz: "Fikringiz «Sazanchik»ni yaxshilaydi",
    en: "Your feedback makes Sazanchik better",
    tr: "Görüşünüz Sazanchik'i daha iyi yapar",
  },
  placeholder: {
    ru: "Пара слов о визите (необязательно)",
    uz: "Tashrif haqida bir-ikki og'iz so'z (ixtiyoriy)",
    en: "A few words about your visit (optional)",
    tr: "Ziyaretiniz hakkında birkaç söz (isteğe bağlı)",
  },
  name: {
    ru: "Ваше имя (необязательно)",
    uz: "Ismingiz (ixtiyoriy)",
    en: "Your name (optional)",
    tr: "Adınız (isteğe bağlı)",
  },
  submit: { ru: "Отправить", uz: "Yuborish", en: "Submit", tr: "Gönder" },
  pickStars: {
    ru: "Сначала поставьте оценку ⭐",
    uz: "Avval baho qo'ying ⭐",
    en: "Pick a star rating first ⭐",
    tr: "Önce yıldız verin ⭐",
  },
  thanks: {
    ru: "Спасибо за отзыв! 🐟",
    uz: "Fikringiz uchun rahmat! 🐟",
    en: "Thank you for your review! 🐟",
    tr: "Yorumunuz için teşekkürler! 🐟",
  },
  thanksSub: {
    ru: "Мы читаем каждый отзыв — и становимся лучше.",
    uz: "Har bir fikrni o'qiymiz — va yaxshilanamiz.",
    en: "We read every review — and keep improving.",
    tr: "Her yorumu okuyoruz — ve gelişiyoruz.",
  },
  error: {
    ru: "Не получилось отправить — попробуйте ещё раз",
    uz: "Yuborilmadi — qayta urinib ko'ring",
    en: "Couldn't send — please try again",
    tr: "Gönderilemedi — tekrar deneyin",
  },
} as const;

const STAR_HINTS: Record<number, { ru: string; uz: string; en: string; tr: string }> = {
  1: { ru: "Плохо", uz: "Yomon", en: "Poor", tr: "Kötü" },
  2: { ru: "Так себе", uz: "O'rtacha emas", en: "Fair", tr: "İdare eder" },
  3: { ru: "Нормально", uz: "Yaxshi", en: "Good", tr: "İyi" },
  4: { ru: "Хорошо", uz: "Juda yaxshi", en: "Very good", tr: "Çok iyi" },
  5: { ru: "Превосходно!", uz: "A'lo!", en: "Excellent!", tr: "Mükemmel!" },
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "size-9 transition-all duration-200 md:size-10",
        filled ? "scale-110 fill-gold stroke-gold" : "fill-transparent stroke-muted-foreground/40"
      )}
      strokeWidth="1.3"
    >
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.58l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}

export function ReviewForm() {
  const { locale } = useLocale();
  const { tableToken } = useTableNumber();
  const t = (k: keyof typeof T) => T[k][locale] ?? T[k].ru;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const shown = hover || rating;

  const submit = async () => {
    if (!rating) {
      toast.info(t("pickStars"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          guestName: name.trim(),
          tableToken: tableToken ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? t("error"));
        return;
      }
      setSent(true);
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-3xl border border-gold/20 bg-card/40 px-6 py-12 text-center">
        <div className="font-heading text-3xl text-gold">{"⭐".repeat(rating)}</div>
        <p className="mt-3 font-heading text-2xl">{t("thanks")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("thanksSub")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gold/20 bg-card/40 px-5 py-8 md:px-8">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.35em] text-gold">
          — {t("title")} —
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Звёзды */}
      <div
        className="mt-5 flex items-center justify-center gap-1.5"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label={t("title")}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} ★`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-full p-0.5 transition-transform active:scale-90"
          >
            <Star filled={n <= shown} />
          </button>
        ))}
      </div>
      <div className="mt-1 h-5 text-center text-xs text-gold">
        {shown ? (STAR_HINTS[shown][locale] ?? STAR_HINTS[shown].ru) : " "}
      </div>

      {/* Комментарий с живым счётчиком 0/100 */}
      <div className="mx-auto mt-3 max-w-md">
        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX))}
            maxLength={MAX}
            rows={3}
            placeholder={t("placeholder")}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50"
          />
          <span
            className={cn(
              "pointer-events-none absolute bottom-2.5 right-3.5 text-[11px] tabular-nums",
              comment.length >= MAX ? "text-red-400" : "text-muted-foreground/60"
            )}
          >
            {comment.length}/{MAX}
          </span>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          placeholder={t("name")}
          className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="mt-3 w-full rounded-full bg-gold py-3 text-sm font-medium uppercase tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "…" : t("submit")}
        </button>
      </div>
    </div>
  );
}
