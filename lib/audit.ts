import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { getSession } from "@/lib/session";

export type AuditAction =
  | "order.cancel"
  | "bill.close"
  | "stock.adjust"
  | "payroll.pay"
  | "expense.delete"
  | "dish.delete";

/**
 * Запись в аудит-лог чувствительного действия персонала. Сессию берёт сам
 * (вызывается уже после гарда экшена). Best-effort: сбой лога никогда не
 * роняет само действие, но уходит в console.error, чтобы пропажа журнала
 * не осталась незамеченной.
 */
export async function logAudit(
  action: AuditAction,
  entityId?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const session = await getSession();
    await db.insert(auditLog).values({
      actor: session?.name ?? session?.role ?? "unknown",
      role: session?.role ?? "unknown",
      action,
      entityId: entityId ?? null,
      details: details ?? {},
    });
  } catch (e) {
    console.error("audit log failed (non-fatal):", e);
  }
}
