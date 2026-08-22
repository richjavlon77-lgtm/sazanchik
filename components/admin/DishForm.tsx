"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveDish, deleteDish, discardUnsavedImage, type DishFormInput } from "@/lib/admin-actions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DishPreview } from "@/components/admin/DishPreview";

const DIET_OPTIONS: { value: string; label: string }[] = [
  { value: "veg", label: "🌱 Вегетарианское" },
  { value: "fish", label: "🐟 Рыба" },
  { value: "sweet", label: "🍰 Сладкое" },
  { value: "alcohol", label: "🥂 Алкоголь" },
];

type Variant = {
  labelRu: string;
  labelUz: string;
  labelEn: string;
  labelTr?: string;
  price: number;
  /** Доля рецепта блюда, списываемая за эту порцию (1 = целый рецепт) */
  stockFactor?: number;
};

export function DishForm({
  dishId,
  categories,
  initial,
}: {
  dishId: string | null;
  categories: { id: string; slug: string; nameRu: string }[];
  initial?: Partial<DishFormInput> & { variants?: Variant[] };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initialImageUrl = initial?.imageUrl ?? "";

  const [form, setForm] = useState<DishFormInput>({
    categorySlug: initial?.categorySlug ?? categories[0]?.slug ?? "",
    slug: initial?.slug ?? "",
    nameRu: initial?.nameRu ?? "",
    nameUz: initial?.nameUz ?? "",
    nameTr: initial?.nameTr ?? "",
    nameEn: initial?.nameEn ?? "",
    descriptionRu: initial?.descriptionRu ?? "",
    descriptionUz: initial?.descriptionUz ?? "",
    descriptionTr: initial?.descriptionTr ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    price: initial?.price ?? null,
    weight: initial?.weight ?? "",
    imageUrl: initial?.imageUrl ?? "",
    spicy: initial?.spicy ?? null,
    diet: initial?.diet ?? [],
    calories: initial?.calories ?? null,
    allergens: initial?.allergens ?? [],
    isPublished: initial?.isPublished ?? true,
    sortOrder: initial?.sortOrder ?? 0,
    variants: initial?.variants ?? [],
  });

  const set = <K extends keyof DishFormInput>(key: K, val: DishFormInput[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const useVariants = (form.variants?.length ?? 0) > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nameRu.trim()) {
      setError("Укажите название блюда (RU)");
      return;
    }

    startTransition(async () => {
      try {
        await saveDish(dishId, form);
        toast.success(dishId ? "Блюдо обновлено" : "Блюдо создано");
        router.push("/admin");
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
        toast.error("Не удалось сохранить");
      }
    });
  };

  const handleDelete = () => {
    if (!dishId) return;
    if (!confirm("Удалить это блюдо?")) return;
    startTransition(async () => {
      try {
        await deleteDish(dishId);
        toast.success("Блюдо удалено");
        router.push("/admin");
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

      {/* Live preview */}
      <DishPreview form={form} />

      {/* Category */}
      <Field label="Категория">
        <select
          value={form.categorySlug}
          onChange={(e) => set("categorySlug", e.target.value)}
          className={input}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nameRu}
            </option>
          ))}
        </select>
      </Field>

      {/* Names */}
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Название RU" hint="обязательно">
          <input value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)} className={input} placeholder="Плов" />
        </Field>
        <Field label="Название UZ" hint="можно пусто = RU">
          <input value={form.nameUz} onChange={(e) => set("nameUz", e.target.value)} className={input} />
        </Field>
        <Field label="Название EN" hint="можно пусто = RU">
          <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={input} />
        </Field>
        <Field label="Название TR" hint="можно пусто = RU">
          <input value={form.nameTr ?? ""} onChange={(e) => set("nameTr", e.target.value)} className={input} />
        </Field>
      </div>

      {/* Descriptions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Описание RU" hint="необязательно">
          <textarea
            value={form.descriptionRu}
            onChange={(e) => set("descriptionRu", e.target.value)}
            className={`${input} min-h-[88px] resize-y`}
            placeholder="Короткое аппетитное описание"
          />
        </Field>
        <Field label="Описание UZ" hint="можно пусто = RU">
          <textarea
            value={form.descriptionUz}
            onChange={(e) => set("descriptionUz", e.target.value)}
            className={`${input} min-h-[88px] resize-y`}
          />
        </Field>
        <Field label="Описание EN" hint="можно пусто = RU">
          <textarea
            value={form.descriptionEn}
            onChange={(e) => set("descriptionEn", e.target.value)}
            className={`${input} min-h-[88px] resize-y`}
          />
        </Field>
        <Field label="Описание TR" hint="можно пусто = RU">
          <textarea
            value={form.descriptionTr ?? ""}
            onChange={(e) => set("descriptionTr", e.target.value)}
            className={`${input} min-h-[88px] resize-y`}
          />
        </Field>
      </div>

      {/* Price + weight + spicy */}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Цена (сум)">
          {useVariants ? (
            <div className="rounded-lg border border-gold/25 bg-gold/[0.05] px-3 py-2 text-xs text-muted-foreground">
              Цена задаётся в «Вариантах порций» ниже ↓
            </div>
          ) : (
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) =>
                set("price", e.target.value ? Number(e.target.value) : null)
              }
              className={input}
              placeholder="50000"
            />
          )}
        </Field>
        <Field label="Граммовка/штуки">
          <input value={form.weight} onChange={(e) => set("weight", e.target.value)} className={input} placeholder="300, 1 кг..." />
        </Field>
        <Field label="Острота (1-3)">
          <div className="flex items-center gap-2">
            {[null, 1, 2, 3].map((v) => (
              <button
                key={v ?? "none"}
                type="button"
                onClick={() => set("spicy", v as 1 | 2 | 3 | null)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  form.spicy === v
                    ? "border-gold bg-gold text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-gold/40"
                }`}
              >
                {v === null ? "—" : "🌶".repeat(v)}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Calories + allergens */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Калорийность (ккал)" hint="необязательно">
          <input
            type="number"
            value={form.calories ?? ""}
            onChange={(e) =>
              set("calories", e.target.value ? Number(e.target.value) : null)
            }
            className={input}
            placeholder="320"
          />
        </Field>
        <Field label="Аллергены" hint="через запятую">
          <input
            value={(form.allergens ?? []).join(", ")}
            onChange={(e) =>
              set(
                "allergens",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            className={input}
            placeholder="орехи, молоко, глютен"
          />
        </Field>
      </div>

      {/* Diet tags */}
      <Field label="Диет-теги">
        <div className="flex flex-wrap gap-2">
          {DIET_OPTIONS.map((d) => {
            const active = form.diet.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  set(
                    "diet",
                    active
                      ? form.diet.filter((v) => v !== d.value)
                      : [...form.diet, d.value]
                  )
                }
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/40"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Image */}
      <Field label="Фото блюда">
        <ImageUploader
          value={form.imageUrl ?? ""}
          onChange={(url) => set("imageUrl", url)}
        />
      </Field>

      {/* Variants */}
      <div className="space-y-3 rounded-lg border border-border bg-card/30 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Варианты порций</h3>
          <button
            type="button"
            onClick={() =>
              set("variants", [
                ...(form.variants ?? []),
                { labelRu: "", labelUz: "", labelEn: "", price: 0, stockFactor: 1 },
              ])
            }
            className="rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-wider text-gold hover:bg-gold/10"
          >
            + Добавить вариант
          </button>
        </div>
        {form.variants?.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Используется одна цена (см. поле «Цена» выше). Добавь варианты если у блюда несколько порций (малая/большая, 4 шт/8 шт).
          </p>
        )}
        {(form.variants?.length ?? 0) > 0 && (
          <p className="text-xs text-muted-foreground">
            «Коэф. склада» — какая доля рецепта блюда списывается за эту
            порцию: малая 0.7, большая 1, двойная 2. Пусто = 1.
          </p>
        )}
        {form.variants?.map((v, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-7">
            <input
              placeholder="Порция RU (малая)"
              value={v.labelRu}
              onChange={(e) => {
                const next = [...(form.variants ?? [])];
                next[i] = { ...next[i], labelRu: e.target.value };
                set("variants", next);
              }}
              className={input}
            />
            <input
              placeholder="UZ (kichik)"
              value={v.labelUz}
              onChange={(e) => {
                const next = [...(form.variants ?? [])];
                next[i] = { ...next[i], labelUz: e.target.value };
                set("variants", next);
              }}
              className={input}
            />
            <input
              placeholder="EN (small)"
              value={v.labelEn}
              onChange={(e) => {
                const next = [...(form.variants ?? [])];
                next[i] = { ...next[i], labelEn: e.target.value };
                set("variants", next);
              }}
              className={input}
            />
            <input
              placeholder="TR (küçük)"
              value={v.labelTr ?? ""}
              onChange={(e) => {
                const next = [...(form.variants ?? [])];
                next[i] = { ...next[i], labelTr: e.target.value };
                set("variants", next);
              }}
              className={input}
            />
            <input
              type="number"
              placeholder="Цена"
              value={v.price}
              onChange={(e) => {
                const next = [...(form.variants ?? [])];
                next[i] = { ...next[i], price: Number(e.target.value) };
                set("variants", next);
              }}
              className={input}
            />
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Коэф. склада (1)"
              title="Доля рецепта блюда за эту порцию: 0.7 = малая, 2 = двойная"
              value={v.stockFactor ?? ""}
              onChange={(e) => {
                const next = [...(form.variants ?? [])];
                const raw = e.target.value;
                next[i] = {
                  ...next[i],
                  stockFactor: raw === "" ? undefined : Number(raw),
                };
                set("variants", next);
              }}
              className={input}
            />
            <button
              type="button"
              onClick={() =>
                set(
                  "variants",
                  (form.variants ?? []).filter((_, idx) => idx !== i)
                )
              }
              className="rounded-lg border border-border px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>

      {/* Publish toggle */}
      <Field label="Публикация">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="size-4"
          />
          <span className="text-sm">
            Показывать на публичном сайте
          </span>
        </label>
      </Field>

      {/* Advanced (technical) — hidden by default */}
      <details className="rounded-lg border border-border/60 bg-card/20 px-4 py-3">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Дополнительно (для разработчика)
        </summary>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Field label="Slug (URL-id)" hint="заполнится сам из названия">
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={input}
              placeholder="генерируется автоматически"
            />
          </Field>
          <Field label="Порядок" hint="обычно меняется перетаскиванием">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
              className={input}
            />
          </Field>
        </div>
      </details>

      {/* Submit */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-card/95 p-4 backdrop-blur-md">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Сохраняем…" : dishId ? "Сохранить" : "Создать"}
          </button>
          <button
            type="button"
            onClick={() => {
              // Photo was uploaded (storage/DB row created) but the form was
              // never saved — clean it up instead of leaking it forever.
              if (form.imageUrl && form.imageUrl !== initialImageUrl) {
                discardUnsavedImage(form.imageUrl).catch(() => {});
              }
              router.back();
            }}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Отмена
          </button>
        </div>
        {dishId && (
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
