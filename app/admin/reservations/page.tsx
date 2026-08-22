import { db } from "@/db";
import { reservations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ReservationActions } from "@/components/admin/ReservationActions";
import { tableLabel } from "@/lib/tables";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  new: { text: "Новая", cls: "bg-gold/15 text-gold" },
  confirmed: { text: "Подтверждена", cls: "bg-sky-500/15 text-sky-400" },
  seated: { text: "Посадили", cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled: { text: "Отменена", cls: "bg-red-500/15 text-red-400" },
};

function fmt(d: Date) {
  return new Date(d).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReservationsPage() {
  const rows = await db
    .select()
    .from(reservations)
    .orderBy(desc(reservations.reservedAt));

  const active = rows.filter((r) => r.status === "new" || r.status === "confirmed");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Брони столов</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} всего · {active.length} активных
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 px-5 py-12 text-center text-sm text-muted-foreground">
          Пока нет броней.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          {rows.map((r) => {
            const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.new;
            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-base">{r.name}</span>
                    {r.isBirthday && (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">
                        🎂 ДР · −10%
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${s.cls}`}
                    >
                      {s.text}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <a href={`tel:${r.phone}`} className="text-foreground hover:text-gold">
                      {r.phone}
                    </a>{" "}
                    · {fmt(r.reservedAt)} · {r.guests} гость(ей)
                    {r.tableNumber ? ` · ${tableLabel(r.tableNumber)}` : ""}
                  </div>
                  {r.comment && (
                    <div className="mt-1 text-xs text-muted-foreground/80 italic">
                      «{r.comment}»
                    </div>
                  )}
                </div>
                <ReservationActions id={r.id} status={r.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
