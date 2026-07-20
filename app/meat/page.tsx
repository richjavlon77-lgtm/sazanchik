import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadStationOrders } from "@/lib/station-data";
import { StationBoard } from "@/components/staff/StationBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мясной цех · Сазанчик",
  robots: { index: false, follow: false },
};

export default async function MeatPage() {
  const session = await getSession();
  if (!session || (session.role !== "meat" && session.role !== "manager")) {
    redirect("/meat/login");
  }
  const orders = await loadStationOrders("meat");
  return (
    <StationBoard station="meat" orders={orders} name={session.name ?? "мясной цех"} />
  );
}
