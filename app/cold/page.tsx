import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadStationOrders } from "@/lib/station-data";
import { StationBoard } from "@/components/staff/StationBoard";

export const dynamic = "force-dynamic";

export default async function ColdPage() {
  const session = await getSession();
  if (!session || (session.role !== "cold" && session.role !== "manager")) {
    redirect("/cold/login");
  }
  const orders = await loadStationOrders("cold");
  return (
    <StationBoard station="cold" orders={orders} name={session.name ?? "холодный цех"} />
  );
}
