"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCategory, deleteCategory, type CategoryFormInput } from "@/lib/admin-actions";

export function CategoryForm({
  catId,
  initial,
}: {
  catId: string | null;
  initial?: Partial<CategoryFormInput>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CategoryFormInput>({
    slug: initial?.slug ?? "",
    nameRu: initial?.nameRu ?? "",
    nameUz: initial?.nameUz ?? "",
    nameEn: initial?.nameEn ?? "",
    nameTr: initial?.nameTr ?? "",
    introRu: initial?.introRu ?? "",
    introUz: initial?.introUz ?? "",
    introEn: initial?.introEn ?? "",
    introTr: initial?.introTr ?? "",
    isPublished: initial?.isPublished ?? true,
    sortOrder: initial?.sortOrder ?? 0,
  });

  const set = <K extends keyof CategoryFormInput>(key: K, val: CategoryFormInput[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.slug || !form.nameRu) {
      setError("Slug и название RU обязательны");
      return;
    }
    startTransition(async () => {
      try {
        await saveCategory(catId, form);
        toast.success(catId ? "Категория обновлена" : "Категория создана");
        router.push("/admin/categories");
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
        toast.error("Не удалось сохранить");
      }
    });
  };

  const handleDelete = () => {
    if (!catId) return;
    if (!confirm("Удалить категорию? Все блюда внутри тоже удалятся!")) return;
    startTransition(async () => {
      try {
        await deleteCategory(catId);
        toast.success("Категория удалена");
        router.push("/admin/categories");
        router.refresh();
      } catch {
        toast.error("Ошибка удаления");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Slug" hint="латиница, без пробелов">
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={input}
            placeholder="cold-starters"
          />
        </Field>
        <Field label="Порядок">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            className={input}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Название RU">
          <input value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)} className={input} />
        </Field>
        <Field label="Название UZ">
          <input value={form.nameUz} onChange={(e) => set("nameUz", e.target.value)} className={input} />
        </Field>
        <Field label="Название EN">
          <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={input} />
        </Field>
        <Field label="Название TR" hint="можно пусто = RU">
          <input value={form.nameTr ?? ""} onChange={(e) => set("nameTr", e.target.value)} className={input} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Вступление RU" hint="редакторский текст под заголовком">
          <textarea
            value={form.introRu ?? ""}
            onChange={(e) => set("introRu", e.target.value)}
            className={`${input} min-h-[100px]`}
          />
        </Field>
        <Field label="Вступление UZ">
          <textarea
            value={form.introUz ?? ""}
            onChange={(e) => set("introUz", e.target.value)}
            className={`${input} min-h-[100px]`}
          />
        </Field>
        <Field label="Вступление EN">
          <textarea
            value={form.introEn ?? ""}
            onChange={(e) => set("introEn", e.target.value)}
            className={`${input} min-h-[100px]`}
          />
        </Field>
        <Field label="Вступление TR">
          <textarea
            value={form.introTr ?? ""}
            onChange={(e) => set("introTr", e.target.value)}
            className={`${input} min-h-[100px]`}
          />
        </Field>
      </div>

      <Field label="Публикация">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="size-4"
          />
          <span className="text-sm">Показывать на публичном сайте</span>
        </label>
      </Field>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-card/95 p-4 backdrop-blur-md">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Сохраняем…" : catId ? "Сохранить" : "Создать"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Отмена
          </button>
        </div>
        {catId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-full border border-red-500/30 px-4 py-2 text-xs uppercase tracking-wider text-red-400 hover:bg-red-500/10"
          >
            Удалить
          </button>
        )}
      </div>
    </form>
  );
}

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/50";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline justify-between text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span>{label}</span>
        {hint && <span className="text-[10px] normal-case opacity-70">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
