import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadStationOrders } from "@/lib/station-data";
import { StationBoard } from "@/components/staff/StationBoard";

export const dynamic = "force-dynamic";

export default async function BarPage() {
  const session = await getSession();
  if (!session || (session.role !== "bartender" && session.role !== "manager")) {
    redirect("/bar/login");
  }
  const orders = await loadStationOrders("bar");
  return (
    <StationBoard station="bar" orders={orders} name={session.name ?? "бармен"} />
  );
}
