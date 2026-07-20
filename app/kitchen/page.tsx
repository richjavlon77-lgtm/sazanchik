import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadStationOrders } from "@/lib/station-data";
import { StationBoard } from "@/components/staff/StationBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Кухня · Сазанчик",
  robots: { index: false, follow: false },
};

export default async function KitchenPage() {
  const session = await getSession();
  if (!session || (session.role !== "cook" && session.role !== "manager")) {
    redirect("/kitchen/login");
  }
  const orders = await loadStationOrders("kitchen");
  return (
    <StationBoard
      station="kitchen"
      orders={orders}
      name={session.name ?? "повар"}
      secondaryLink={{ href: "/kitchen/stop", label: "Стоп-лист" }}
    />
  );
}
