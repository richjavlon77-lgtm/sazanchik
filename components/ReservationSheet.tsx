"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale, t } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const L = {
  cta: { ru: "Забронировать стол", uz: "Stol band qilish", en: "Book a table" },
  title: { ru: "Бронь стола", uz: "Stolni band qilish", en: "Table reservation" },
  sub: {
    ru: "Оставьте заявку — мы перезвоним для подтверждения",
    uz: "Ariza qoldiring — tasdiqlash uchun qo‘ng‘iroq qilamiz",
    en: "Leave a request — we'll call to confirm",
  },
  name: { ru: "Имя", uz: "Ism", en: "Name" },
  phone: { ru: "Телефон", uz: "Telefon", en: "Phone" },
  when: { ru: "Дата и время", uz: "Sana va vaqt", en: "Date & time" },
  guests: { ru: "Гостей", uz: "Mehmonlar", en: "Guests" },
  table: { ru: "Стол (если есть пожелание)", uz: "Stol (ixtiyoriy)", en: "Table (optional)" },
  comment: { ru: "Комментарий", uz: "Izoh", en: "Comment" },
  birthday: { ru: "У меня день рождения — скидка 10%", uz: "Tug‘ilgan kunim — 10% chegirma", en: "It's my birthday — 10% off" },
  birthdayNote: {
    ru: "Скидку подтвердит официант по документу",
    uz: "Chegirmani ofitsiant hujjat bo‘yicha tasdiqlaydi",
    en: "Waiter confirms the discount by ID",
  },
  submit: { ru: "Отправить заявку", uz: "Yuborish", en: "Send request" },
  sending: { ru: "Отправляем…", uz: "Yuborilyapti…", en: "Sending…" },
  ok: { ru: "Заявка отправлена! Мы скоро перезвоним.", uz: "Ariza yuborildi!", en: "Request sent! We'll call you soon." },
  err: { ru: "Не удалось отправить. Попробуйте ещё раз.", uz: "Xatolik. Qayta urinib ko‘ring.", en: "Failed. Try again." },
};

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-gold/60 focus:ring-3 focus:ring-gold/20";

// Default datetime = today 19:00 (local), formatted for datetime-local input
function defaultWhen(): string {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReservationSheet({ className }: { className?: string }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    reservedAt: defaultWhen(),
    guests: 2,
    tableNumber: "",
    comment: "",
    isBirthday: false,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError(t(L.name, locale));
    if (form.phone.trim().length < 7) return setError(t(L.phone, locale));
    setBusy(true);
    try {
      const res = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || t(L.err, locale));
      }
      toast.success(t(L.ok, locale));
      setOpen(false);
      setForm((p) => ({ ...p, name: "", phone: "", comment: "", isBirthday: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t(L.err, locale);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-full border border-primary/30 px-4 py-3 text-[13.5px] font-medium text-primary transition-colors duration-300 hover:bg-primary/[0.05]",
          className
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-[15px]">
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
        </svg>
        {t(L.cta, locale)}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto size-3.5">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto border-t border-gold/20 bg-card sm:mx-auto sm:max-w-lg sm:rounded-t-2xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-2xl">
              {t(L.title, locale)}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t(L.sub, locale)}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={submit} className="space-y-4 px-1 pb-6 pt-2">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t(L.name, locale)}
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={field}
                autoComplete="name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t(L.phone, locale)}
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={field}
                  placeholder="+998 ..."
                  autoComplete="tel"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t(L.guests, locale)}
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.guests}
                  onChange={(e) => set("guests", Math.max(1, Number(e.target.value) || 1))}
                  className={cn(field, "tabular-nums")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t(L.when, locale)}
                </label>
                <input
                  type="datetime-local"
                  value={form.reservedAt}
                  onChange={(e) => set("reservedAt", e.target.value)}
                  className={field}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t(L.table, locale)}
                </label>
                <input
                  value={form.tableNumber}
                  onChange={(e) => set("tableNumber", e.target.value)}
                  className={cn(field, "tabular-nums")}
                  placeholder="№"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t(L.comment, locale)}
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => set("comment", e.target.value)}
                rows={2}
                className={cn(field, "resize-none")}
              />
            </div>

            {/* Birthday → 10% discount */}
            <button
              type="button"
              onClick={() => set("isBirthday", !form.isBirthday)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                form.isBirthday
                  ? "border-gold/50 bg-gold/[0.06]"
                  : "border-border bg-background/40 hover:border-gold/30"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  form.isBirthday ? "border-gold bg-gold text-primary-foreground" : "border-muted-foreground/40"
                )}
              >
                {form.isBirthday && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span>
                <span className="block text-sm">🎂 {t(L.birthday, locale)}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {t(L.birthdayNote, locale)}
                </span>
              </span>
            </button>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gold py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {busy ? t(L.sending, locale) : t(L.submit, locale)}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
