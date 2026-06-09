export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 h-9 w-48 animate-pulse rounded-lg bg-gold/10" />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-border bg-gold/[0.06]"
          />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-border bg-card/40"
          />
        ))}
      </div>
    </div>
  );
}
