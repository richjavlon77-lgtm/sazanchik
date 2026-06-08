"use client";

import { useFavorites } from "@/lib/favorites-context";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function FavoriteButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(id);
  const [bounce, setBounce] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
        setBounce(true);
        setTimeout(() => setBounce(false), 350);
      }}
      className={cn(
        "shrink-0 rounded-full p-1 text-muted-foreground transition-all duration-300 hover:text-rose-400",
        active && "text-rose-400",
        bounce && "scale-150",
        className
      )}
      aria-label="Favorite"
      aria-pressed={active}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        className="size-4"
      >
        <path
          d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 6 5c2 0 4 1.5 6 4 2-2.5 4-4 6-4 3 0 5 3.5 3.5 7-2.5 4.65-9.5 9-9.5 9z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
