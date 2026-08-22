import { requireArea } from "@/lib/area-guard";

/**
 * Гард всей панели управления (route group — URL не меняются).
 * /admin/login живёт вне группы и рендерится без сессии; всё остальное
 * требует менеджера даже при обходе proxy.ts (страховка от middleware-CVE).
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("manager", "/admin/login");
  return children;
}
