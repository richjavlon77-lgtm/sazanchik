"use client";

import { usePathname } from "next/navigation";
import { CartBar } from "@/components/CartBar";
import { WaiterButton } from "@/components/WaiterButton";
import { HashHighlighter } from "@/components/HashHighlighter";
import { IntroSplash } from "@/components/IntroSplash";
import { OrderTracker } from "@/components/OrderTracker";
import { OrderQueueFlusher } from "@/components/OrderQueueFlusher";

// Staff/admin/signage contours that must NOT show guest widgets.
const STAFF_AREAS = [
  "/admin",
  "/staff",
  "/tv",
  "/print",
  "/waiter",
  "/bar",
  "/hookah",
  "/kitchen",
  "/cold",
  "/meat",
];

/**
 * Client-facing widgets (cart, call-waiter, intro splash) belong only to the
 * guest site — never to a staff/admin contour.
 */
export function ClientChrome() {
  const pathname = usePathname();
  if (STAFF_AREAS.some((p) => pathname.startsWith(p))) {
    return null;
  }
  return (
    <>
      <CartBar />
      <WaiterButton />
      <HashHighlighter />
      <IntroSplash />
      <OrderTracker />
      <OrderQueueFlusher />
    </>
  );
}
