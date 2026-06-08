import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5",
        className
      )}
    />
  );
}

export function CategoryNavSkeleton() {
  return (
    <div className="mb-10 flex flex-wrap gap-2 px-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <Pulse key={i} className="h-8 w-28 rounded-full" />
      ))}
    </div>
  );
}

export function MenuItemCardSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-border/50 px-1 py-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Pulse className="h-4 w-40" />
        <Pulse className="h-3 w-64" />
        <Pulse className="h-4 w-20" />
      </div>
      <Pulse className="size-16 shrink-0 rounded-lg" />
    </div>
  );
}

export function MenuSectionSkeleton() {
  return (
    <div className="mb-8">
      <div className="mb-4 space-y-2">
        <Pulse className="h-6 w-48" />
        <Pulse className="h-3 w-72" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <MenuItemCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function MenuPageSkeleton() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
      {/* Hero skeleton */}
      <div className="mb-8 mt-16 space-y-4 text-center">
        <Pulse className="mx-auto h-10 w-64" />
        <Pulse className="mx-auto h-4 w-48" />
        <Pulse className="mx-auto h-3 w-80" />
      </div>

      <CategoryNavSkeleton />

      {Array.from({ length: 3 }).map((_, i) => (
        <MenuSectionSkeleton key={i} />
      ))}
    </div>
  );
}

export function WaiterButtonSkeleton() {
  return (
    <Pulse className="fixed bottom-5 right-5 z-50 h-11 w-32 rounded-full md:bottom-8 md:right-8" />
  );
}
