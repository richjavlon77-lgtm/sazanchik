"use client";

import { useMemo } from "react";
import { MenuProvider } from "@/lib/menu-context";
import { sortMenuByTimeOfDay } from "@/lib/time-sort";
import { useHydrated } from "@/lib/local-store";
import type { MenuCategory } from "@/types/menu";

/**
 * Sorts menu by current Tashkent hour on the client to avoid SSR/CSR hour drift.
 * Until hydrated, shows the original order — no state, just derived data.
 */
export function TimeAwareMenuProvider({
  menu,
  children,
}: {
  menu: MenuCategory[];
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const sorted = useMemo(
    () => (hydrated ? sortMenuByTimeOfDay(menu) : menu),
    [hydrated, menu]
  );

  return <MenuProvider menu={sorted}>{children}</MenuProvider>;
}
