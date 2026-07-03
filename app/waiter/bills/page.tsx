import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadOpenBills } from "@/lib/bills-data";
import { BillsBoard } from "@/components/waiter/BillsBoard";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    redirect("/waiter/login");
  }
  const bills = await loadOpenBills();
  return <BillsBoard bills={bills} name={session.name ?? "официант"} />;
}
