"use client";

import { useState, useTransition } from "react";

/** Wall-clock snapshot taken once on mount — stable across re-renders. */
function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
import { toast } from "sonner";
import { saveFootballEvent, deleteFootballEvent } from "@/lib/admin-actions";

export type EventRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string; // ISO
  league: string | null;
  note: string | null;
};

const field =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FootballManager({ initial }: { initial: EventRow[] }) {
  const [pending, start] = useTransition();
  const now = useNow();
  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    startsAt: "",
    league: "",
    note: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        await saveFootballEvent(null, { ...form, isPublished: true });
        toast.success("Матч добавлен");
        setForm({ homeTeam: "", awayTeam: "", startsAt: "", league: "", note: "" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const remove = (id: string, label: string) => {
    if (!confirm(`Удалить матч «${label}»?`)) return;
    start(async () => {
      try {
        await deleteFootballEvent(id);
        toast.success("Удалён");
      } catch {
        toast.error("Ошибка");
      }
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="grid gap-3 rounded-2xl border border-gold/20 bg-card/40 p-4 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Команда 1 (дом)
          </label>
          <input value={form.homeTeam} onChange={(e) => set("homeTeam", e.target.value)} className={field} placeholder="Реал Мадрид" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Команда 2 (гости)
          </label>
          <input value={form.awayTeam} onChange={(e) => set("awayTeam", e.target.value)} className={field} placeholder="Барселона" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Дата и время
          </label>
          <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={field} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Турнир (необяз.)
          </label>
          <input value={form.league} onChange={(e) => set("league", e.target.value)} className={field} placeholder="Ла Лига" />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Заметка (необяз.)
          </label>
          <input value={form.note} onChange={(e) => set("note", e.target.value)} className={field} placeholder="Большой экран · бронируйте стол" />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            + Добавить матч
          </button>
        </div>
      </form>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Пока нет матчей. Прошедшие скрываются автоматически.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          {initial.map((m) => {
            const label = `${m.homeTeam} — ${m.awayTeam}`;
            const past = new Date(m.startsAt).getTime() < now;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-base">{label}</span>
                    {past && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                        прошёл
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(m.startsAt)}
                    {m.league ? ` · ${m.league}` : ""}
                    {m.note ? ` · ${m.note}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => remove(m.id, label)}
                  disabled={pending}
                  className="shrink-0 rounded-full border border-red-500/30 px-3 py-1 text-[11px] uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                >
                  Удалить
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
