import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadStationOrders } from "@/lib/station-data";
import { StationBoard } from "@/components/staff/StationBoard";

export const dynamic = "force-dynamic";

export default async function HookahPage() {
  const session = await getSession();
  if (!session || (session.role !== "hookah" && session.role !== "manager")) {
    redirect("/hookah/login");
  }
  const orders = await loadStationOrders("hookah");
  return (
    <StationBoard
      station="hookah"
      orders={orders}
      name={session.name ?? "кальянщик"}
    />
  );
}
