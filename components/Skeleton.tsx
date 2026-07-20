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

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <Pulse className="h-9 w-24" />
          <Pulse className="mt-2 h-4 w-56" />
        </div>
        <Pulse className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card/40 p-5">
            <Pulse className="h-3 w-20" />
            <Pulse className="mt-3 h-8 w-24" />
            <Pulse className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card/40">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="space-y-1">
              <Pulse className="h-5 w-32" />
              <Pulse className="h-3 w-20" />
            </div>
            <Pulse className="h-4 w-12" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center justify-between border-b border-border/50 px-5 py-2.5 last:border-b-0">
              <Pulse className="h-4 w-48" />
              <Pulse className="h-4 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function WaiterBoardSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <Pulse className="h-7 w-40" />
          <Pulse className="h-3 w-28" />
        </div>
        <div className="flex gap-2">
          <Pulse className="h-8 w-20 rounded-full" />
          <Pulse className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="mb-4">
        <Pulse className="h-8 w-48 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-3 rounded-2xl border border-border bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pulse className="h-6 w-24" />
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
            <Pulse className="h-3 w-12" />
          </div>
          <div className="mt-3 space-y-1">
            {Array.from({ length: 2 }).map((_, j) => (
              <Pulse key={j} className="h-6 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StationBoardSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <Pulse className="h-7 w-40" />
          <Pulse className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <Pulse className="h-8 w-16 rounded-full" />
          <Pulse className="h-8 w-16 rounded-full" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="mb-3 rounded-2xl border border-border bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <Pulse className="h-6 w-24" />
            <Pulse className="h-3 w-12" />
          </div>
          <div className="mt-2 space-y-1">
            {Array.from({ length: 2 }).map((_, j) => (
              <Pulse key={j} className="h-6 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
