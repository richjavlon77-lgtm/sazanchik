"use client";

import { usePathname } from "next/navigation";
import { CartBar } from "@/components/CartBar";
import { WaiterButton } from "@/components/WaiterButton";
import { HashHighlighter } from "@/components/HashHighlighter";
import { IntroSplash } from "@/components/IntroSplash";
import { OrderTracker } from "@/components/OrderTracker";

/**
 * Client-facing widgets (cart, call-waiter, intro splash) belong only to the
 * guest site — never to the /admin or /waiter contours.
 */
export function ClientChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/waiter")) {
    return null;
  }
  return (
    <>
      <CartBar />
      <WaiterButton />
      <HashHighlighter />
      <IntroSplash />
      <OrderTracker />
    </>
  );
}
