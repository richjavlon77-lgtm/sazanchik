import { cn } from "@/lib/utils";

/**
 * Brand wordmark "Сазанчик CITY" with fish.
 * White art for dark theme, espresso art for light theme — swapped via CSS
 * so it works without client JS (no hydration flash).
 */
export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  const common = "h-auto w-full select-none";
  return (
    <picture>
      {/* dark theme → white logo */}
      <img
        src="/brand-logo.png"
        alt="Сазанчик CITY"
        fetchPriority={priority ? "high" : "auto"}
        className={cn(common, "block light:hidden", className)}
      />
      {/* light theme → espresso logo */}
      <img
        src="/brand-logo-dark.png"
        alt=""
        aria-hidden
        className={cn(common, "hidden light:block", className)}
      />
    </picture>
  );
}
