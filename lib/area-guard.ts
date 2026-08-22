import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { StaffRole } from "@/lib/auth";

/**
 * Страховка на уровне страницы. Первую линию держит proxy.ts, но известны
 * CVE с обходом middleware — поэтому каждая staff/admin-страница проверяет
 * сессию сама (mutations и так защищены внутри server actions).
 *
 * Правило то же, что в proxy: менеджер может смотреть любую доску,
 * остальным роль должна совпадать с зоной.
 */
export async function requireArea(
  role: StaffRole | "manager",
  loginPath: string
): Promise<void> {
  const session = await getSession();
  if (!session || (session.role !== "manager" && session.role !== role)) {
    redirect(loginPath);
  }
}
