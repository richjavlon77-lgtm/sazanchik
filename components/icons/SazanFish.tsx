import { cn } from "@/lib/utils";

/**
 * Stylized sazan (carp) fish — main brand mark.
 * Arched leaping pose, elegant single-weight strokes.
 */
export function SazanFish({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-auto", className)}
      aria-hidden
    >
      {/* Body silhouette — arched carp */}
      <path
        d="M20 60 C 35 30, 80 22, 120 32 C 150 40, 168 52, 178 56 L 195 45 L 192 60 L 195 75 L 178 65 C 168 70, 150 80, 120 86 C 80 92, 35 88, 20 60 Z"
        fill={filled ? "currentColor" : "none"}
      />

      {/* Top dorsal fin */}
      <path
        d="M75 28 C 80 16, 95 14, 105 22 C 100 26, 92 28, 82 30"
        fill={filled ? "currentColor" : "none"}
      />

      {/* Bottom pectoral fin */}
      <path
        d="M85 78 C 92 92, 105 92, 113 86 C 108 82, 98 80, 88 80"
        fill={filled ? "currentColor" : "none"}
      />

      {/* Gill line */}
      <path d="M58 42 C 62 56, 62 64, 58 78" />

      {/* Eye */}
      <circle cx="44" cy="56" r="2.2" fill="currentColor" stroke="none" />

      {/* Scale arc 1 */}
      <path d="M75 50 C 85 55, 95 56, 105 50" opacity={filled ? 0.5 : 0.6} />
      {/* Scale arc 2 */}
      <path d="M100 50 C 110 55, 120 56, 130 50" opacity={filled ? 0.5 : 0.6} />
      {/* Scale arc 3 */}
      <path d="M75 65 C 85 70, 95 71, 105 65" opacity={filled ? 0.5 : 0.6} />
      {/* Scale arc 4 */}
      <path d="M100 65 C 110 70, 120 71, 130 65" opacity={filled ? 0.5 : 0.6} />
    </svg>
  );
}

/**
 * Compact circular monogram with fish — for favicon-like use.
 */
export function SazanMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-auto", className)}
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <g transform="translate(32 32)" stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-20 0 C -14 -12, 8 -16, 18 -8 L 22 -14 L 22 -2 L 22 14 L 22 8 L 18 8 C 8 16, -14 12, -20 0 Z" />
        <circle cx="-13" cy="-2" r="1.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
