"use client";

import { useEffect, useState } from "react";
import { MenuProvider } from "@/lib/menu-context";
import { sortMenuByTimeOfDay } from "@/lib/time-sort";
import type { MenuCategory } from "@/types/menu";

/**
 * Sorts menu by current Tashkent hour on the client to avoid SSR/CSR hour drift.
 * Until hydrated, shows the original order.
 */
export function TimeAwareMenuProvider({
  menu,
  children,
}: {
  menu: MenuCategory[];
  children: React.ReactNode;
}) {
  const [sorted, setSorted] = useState<MenuCategory[]>(menu);

  useEffect(() => {
    setSorted(sortMenuByTimeOfDay(menu));
  }, [menu]);

  return <MenuProvider menu={sorted}>{children}</MenuProvider>;
}
