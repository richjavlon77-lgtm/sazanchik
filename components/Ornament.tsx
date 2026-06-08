import { cn } from "@/lib/utils";

/**
 * Uzbek-inspired geometric medallion. Used as section divider accent.
 */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/40" />
      <svg
        viewBox="0 0 48 48"
        className="size-6 text-gold"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        >
          {/* 8-pointed star */}
          <path d="M24 6 L 27 21 L 42 24 L 27 27 L 24 42 L 21 27 L 6 24 L 21 21 Z" />
          {/* Inner small star rotated */}
          <path
            d="M24 14 L 26 22 L 34 24 L 26 26 L 24 34 L 22 26 L 14 24 L 22 22 Z"
            opacity="0.6"
          />
          {/* Center dot */}
          <circle cx="24" cy="24" r="1.5" fill="currentColor" />
        </g>
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}

/**
 * Background SVG pattern — very subtle repeating Uzbek geometric tile.
 * Used inside fixed background div.
 */
export function OrnamentBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-0 opacity-[0.025]",
        className
      )}
      aria-hidden
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="uzbek-pattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
              className="text-gold"
              transform="translate(60 60)"
            >
              {/* 8-point star outer */}
              <path d="M0 -40 L 10 -25 L 28 -28 L 25 -10 L 40 0 L 25 10 L 28 28 L 10 25 L 0 40 L -10 25 L -28 28 L -25 10 L -40 0 L -25 -10 L -28 -28 L -10 -25 Z" />
              {/* Inner diamond */}
              <path d="M0 -20 L 14 0 L 0 20 L -14 0 Z" />
              {/* Center small star */}
              <path d="M0 -8 L 3 -3 L 8 0 L 3 3 L 0 8 L -3 3 L -8 0 L -3 -3 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#uzbek-pattern)" />
      </svg>
    </div>
  );
}

/**
 * Corner flourish — used at hero corners for editorial feel.
 */
export function CornerFlourish({
  className,
  rotate = 0,
}: {
  className?: string;
  rotate?: number;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("text-gold", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="round"
      >
        <path d="M10 10 Q 35 12, 70 10" opacity="0.5" />
        <path d="M10 14 Q 30 18, 60 14" opacity="0.3" />
        <circle cx="14" cy="14" r="2" />
        <path d="M14 10 L 14 25 M 18 14 L 10 14" opacity="0.6" />
      </g>
    </svg>
  );
}
