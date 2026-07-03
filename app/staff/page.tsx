import type { Metadata } from "next";
import { PinLogin } from "@/components/staff/PinLogin";

export const metadata: Metadata = {
  title: "Панель персонала",
  robots: { index: false, follow: false },
};

/** Unified staff entry: one PIN pad that routes each person to their own
 *  panel by role (waiter / bar / hookah / kitchen / cold / meat). */
export default function StaffEntryPage() {
  return <PinLogin variant="waiter" heading="Панель персонала" />;
}
