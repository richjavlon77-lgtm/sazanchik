import { loadStaffShifts } from "@/lib/staff-shifts";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  waiter: "Официант",
  bartender: "Бармен",
  hookah: "Кальянщик",
  cook: "Повар",
  cold: "Холодный цех",
  meat: "Мясной цех",
};

const dt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const money = new Intl.NumberFormat("ru-RU");

function dur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} ч ${m} мин` : `${m} мин`;
}

export default async function StaffShiftsPage() {
  const shifts = await loadStaffShifts();
  const open = shifts.filter((s) => !s.closedAt).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Смены персонала</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Кто, во сколько открыл и закрыл смену (вход/выход по PIN) и что успел
          за смену. Сейчас на смене:{" "}
          <span className="text-gold">{open}</span> · показаны последние 30 дней.
        </p>
      </div>

      {shifts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Смен пока нет. Они появятся, как только персонал начнёт входить по PIN
          (открытие) и выходить кнопкой «🔑 Сменить» (закрытие).
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/40">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">Сотрудник</th>
                <th className="px-4 py-3 font-medium">Открыл</th>
                <th className="px-4 py-3 font-medium">Закрыл</th>
                <th className="px-4 py-3 font-medium">Длит.</th>
                <th className="px-4 py-3 text-right font-medium">Что делал</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {shifts.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {ROLE_LABEL[s.role] ?? s.role}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dt.format(s.openedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {s.closedAt ? (
                      <span className="text-muted-foreground">
                        {dt.format(s.closedAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-500">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        на смене
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dur(s.durationMin)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-[12px]">
                      {s.role === "waiter" ? (
                        <>
                          <span>
                            <span className="text-muted-foreground">заказы</span>{" "}
                            <b>{s.orders}</b>
                          </span>
                          <span>
                            <span className="text-muted-foreground">выручка</span>{" "}
                            <b className="text-gold">{money.format(s.revenue)}</b>
                          </span>
                          <span>
                            <span className="text-muted-foreground">вызовы</span>{" "}
                            <b>{s.calls}</b>
                          </span>
                        </>
                      ) : (
                        <span>
                          <span className="text-muted-foreground">
                            позиций отдано
                          </span>{" "}
                          <b>{s.positions}</b>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
