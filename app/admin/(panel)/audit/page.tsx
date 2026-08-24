import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { formatPrice } from "@/lib/i18n-core";
import { tableLabel } from "@/lib/tables";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, { text: string; cls: string }> = {
  "order.cancel": { text: "Отмена заказа", cls: "bg-red-500/15 text-red-400" },
  "bill.close": { text: "Закрыт счёт", cls: "bg-emerald-500/15 text-emerald-400" },
  "stock.adjust": { text: "Склад вручную", cls: "bg-sky-500/15 text-sky-400" },
  "payroll.pay": { text: "Выплата ЗП", cls: "bg-gold/15 text-gold" },
  "expense.delete": { text: "Удалён расход", cls: "bg-red-500/15 text-red-400" },
  "dish.delete": { text: "Удалено блюдо", cls: "bg-orange-500/15 text-orange-400" },
  "review.delete": { text: "Удалён отзыв", cls: "bg-red-500/15 text-red-400" },
  "delivery.cancel": { text: "Отмена доставки", cls: "bg-red-500/15 text-red-400" },
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

/** Человекочитаемая строка из details конкретного действия. */
function describe(action: string, d: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof d.table === "string") parts.push(tableLabel(d.table));
  if (typeof d.name === "string") parts.push(String(d.name));
  if (typeof d.employee === "string") parts.push(String(d.employee));
  if (typeof d.items === "number") parts.push(`${d.items} поз.`);
  if (typeof d.days === "number") parts.push(`${d.days} дн`);
  if (typeof d.direction === "string")
    parts.push(d.direction === "receive" ? "приход" : "списание");
  if (typeof d.delta === "number") parts.push(`Δ ${d.delta}`);
  const money = (d.total ?? d.amount) as number | undefined;
  if (typeof money === "number") parts.push(formatPrice(money, "ru"));
  if (typeof d.note === "string" && d.note) parts.push(`«${d.note}»`);
  if (typeof d.category === "string") parts.push(String(d.category));
  return parts.join(" · ");
}

export default async function AuditPage() {
  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Журнал действий</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Кто отменил заказ, закрыл счёт, корректировал склад, платил зарплату.
          Записи не редактируются и не удаляются. Последние 200.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока пусто.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-4 py-3">Когда</th>
                <th className="px-4 py-3">Кто</th>
                <th className="px-4 py-3">Действие</th>
                <th className="px-4 py-3">Детали</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = ACTION_LABEL[r.action] ?? {
                  text: r.action,
                  cls: "bg-muted text-muted-foreground",
                };
                return (
                  <tr key={r.id} className="border-b border-border/40 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                      {fmt(r.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.actor}
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${a.cls}`}>
                        {a.text}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {describe(r.action, r.details)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
