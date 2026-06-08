"use client";

import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ShareButton({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const { locale } = useLocale();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#dish-${id}`;
    const shareText = `${title} — Сазанчик`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t(UI_STRINGS.copied, locale), { description: url });
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-gold",
        className
      )}
      aria-label={t(UI_STRINGS.share, locale)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-3.5"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
      </svg>
    </button>
  );
}
