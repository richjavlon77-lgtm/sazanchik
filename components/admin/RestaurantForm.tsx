"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveRestaurant } from "@/lib/admin-actions";

type RestaurantInput = Parameters<typeof saveRestaurant>[0];

export function RestaurantForm({ initial }: { initial: RestaurantInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantInput>(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const set = <K extends keyof RestaurantInput>(key: K, val: RestaurantInput[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await saveRestaurant(form);
        setSavedAt(new Date());
        toast.success("Данные ресторана сохранены");
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
        toast.error("Не удалось сохранить");
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

      <Section title="Название">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
      </Section>

      <Section title="Слоган">
        <Trilingual
          ru={form.taglineRu}
          uz={form.taglineUz}
          en={form.taglineEn}
          onRu={(v) => set("taglineRu", v)}
          onUz={(v) => set("taglineUz", v)}
          onEn={(v) => set("taglineEn", v)}
          textarea
        />
      </Section>

      <Section title="Адрес">
        <Trilingual
          ru={form.addressRu}
          uz={form.addressUz}
          en={form.addressEn}
          onRu={(v) => set("addressRu", v)}
          onUz={(v) => set("addressUz", v)}
          onEn={(v) => set("addressEn", v)}
        />
      </Section>

      <Section title="Часы работы">
        <Trilingual
          ru={form.hoursRu}
          uz={form.hoursUz}
          en={form.hoursEn}
          onRu={(v) => set("hoursRu", v)}
          onUz={(v) => set("hoursUz", v)}
          onEn={(v) => set("hoursEn", v)}
        />
      </Section>

      <Section title="Телефон">
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={input} placeholder="+998 ..." />
      </Section>

      <Section title="Instagram">
        <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} className={input} placeholder="@sazanchik" />
      </Section>

      <Section title="Условия доставки">
        <p className="mb-3 text-xs text-muted-foreground">
          Показываются гостю в мини-аппе доставки и проверяются при заказе.
          Пустое поле — условие не действует.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Мин. заказ (сум)
            </span>
            <input
              type="number"
              value={form.deliveryMinOrder ?? ""}
              onChange={(e) =>
                set("deliveryMinOrder", e.target.value ? Number(e.target.value) : null)
              }
              className={input}
              placeholder="100 000"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Доставка (сум)
            </span>
            <input
              type="number"
              value={form.deliveryFee ?? ""}
              onChange={(e) =>
                set("deliveryFee", e.target.value ? Number(e.target.value) : null)
              }
              className={input}
              placeholder="20 000"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Бесплатно от (сум)
            </span>
            <input
              type="number"
              value={form.deliveryFreeFrom ?? ""}
              onChange={(e) =>
                set("deliveryFreeFrom", e.target.value ? Number(e.target.value) : null)
              }
              className={input}
              placeholder="300 000"
            />
          </label>
        </div>
      </Section>

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

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/50";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/30 p-4">
      <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">{title}</h3>
      {children}
    </div>
  );
}

function Trilingual({
  ru,
  uz,
  en,
  onRu,
  onUz,
  onEn,
  textarea,
}: {
  ru: string;
  uz: string;
  en: string;
  onRu: (v: string) => void;
  onUz: (v: string) => void;
  onEn: (v: string) => void;
  textarea?: boolean;
}) {
  const Tag = textarea ? "textarea" : "input";
  const tagProps = textarea
    ? { className: `${input} min-h-[72px]` }
    : { className: input };
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">RU</label>
        <Tag value={ru} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onRu(e.target.value)} {...tagProps} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">UZ</label>
        <Tag value={uz} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onUz(e.target.value)} {...tagProps} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">EN</label>
        <Tag value={en} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEn(e.target.value)} {...tagProps} />
      </div>
    </div>
  );
}
