"use client";

import { useState } from "react";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useContent } from "@/lib/content-context";
import { OrnamentDivider } from "@/components/Ornament";
import { SazanFish } from "@/components/icons/SazanFish";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function StoryButton() {
  const { locale } = useLocale();
  const { story: STORY } = useContent();
  const [open, setOpen] = useState(false);

  if (!STORY || STORY.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-gold"
      >
        <span className="h-px w-4 bg-current opacity-40 transition-opacity group-hover:opacity-100" />
        {t(UI_STRINGS.read_more, locale)}
        <span className="h-px w-4 bg-current opacity-40 transition-opacity group-hover:opacity-100" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-gold/20 bg-card">
          <div className="flex flex-col items-center pb-4">
            <SazanFish className="h-12 w-auto text-gold" />
            <DialogTitle className="font-heading mt-4 text-3xl md:text-4xl">
              {t(UI_STRINGS.our_story, locale)}
            </DialogTitle>
            <OrnamentDivider className="mt-3" />
          </div>

          <DialogDescription className="sr-only">
            {t(UI_STRINGS.our_story, locale)}
          </DialogDescription>

          <article className="space-y-8 px-2 pt-2 leading-relaxed text-foreground/90">
            {STORY.map((chapter, i) => (
              <section key={i}>
                <h3 className="font-heading text-2xl text-gold mb-2">
                  {t(chapter.title, locale)}
                </h3>
                <p className="text-[15px] leading-[1.7]">
                  {t(chapter.body, locale)}
                </p>
              </section>
            ))}

            <div className="pt-2 text-center">
              <OrnamentDivider className="opacity-50" />
            </div>
          </article>
        </DialogContent>
      </Dialog>
    </>
  );
}
