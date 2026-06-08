"use client";

import { createContext, useContext } from "react";
import type { RestaurantInfo, Localized } from "@/types/menu";

export type StoryChapter = {
  title: Localized;
  body: Localized;
};

type ContentContextValue = {
  restaurant: RestaurantInfo;
  story: StoryChapter[];
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({
  value,
  children,
}: {
  value: ContentContextValue;
  children: React.ReactNode;
}) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
}
