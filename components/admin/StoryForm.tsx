"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveStory } from "@/lib/admin-actions";

type Chapter = {
  id?: string;
  titleRu: string;
  titleUz: string;
  titleEn: string;
  bodyRu: string;
  bodyUz: string;
  bodyEn: string;
};

export function StoryForm({ initial }: { initial: Chapter[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [chapters, setChapters] = useState<Chapter[]>(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const updateChapter = (i: number, patch: Partial<Chapter>) => {
    setChapters((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveStory(chapters);
      setSavedAt(new Date());
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {chapters.map((ch, i) => (
        <div key={i} className="rounded-xl border border-border bg-card/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.2em] text-gold">
              Глава {i + 1}
            </h3>
            {chapters.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setChapters((p) => p.filter((_, idx) => idx !== i))
                }
                className="text-[10px] uppercase tracking-wider text-red-400 hover:underline"
              >
                Удалить главу
              </button>
            )}
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <LangField label="Заголовок RU" value={ch.titleRu} onChange={(v) => updateChapter(i, { titleRu: v })} />
            <LangField label="Заголовок UZ" value={ch.titleUz} onChange={(v) => updateChapter(i, { titleUz: v })} />
            <LangField label="Заголовок EN" value={ch.titleEn} onChange={(v) => updateChapter(i, { titleEn: v })} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LangField label="Текст RU" value={ch.bodyRu} onChange={(v) => updateChapter(i, { bodyRu: v })} textarea />
            <LangField label="Текст UZ" value={ch.bodyUz} onChange={(v) => updateChapter(i, { bodyUz: v })} textarea />
            <LangField label="Текст EN" value={ch.bodyEn} onChange={(v) => updateChapter(i, { bodyEn: v })} textarea />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setChapters((p) => [
            ...p,
            { titleRu: "", titleUz: "", titleEn: "", bodyRu: "", bodyUz: "", bodyEn: "" },
          ])
        }
        className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-gold/40 hover:text-foreground"
      >
        + Добавить главу
      </button>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-card/95 p-4 backdrop-blur-md">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        {savedAt && (
          <span className="text-[11px] uppercase tracking-wider text-gold">
            ✓ Сохранено в {savedAt.toLocaleTimeString("ru-RU")}
          </span>
        )}
      </div>
    </form>
  );
}

function LangField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/50";
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} min-h-[140px] resize-y leading-relaxed`}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
