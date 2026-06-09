export default function WaiterLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-5">
      <div className="mb-5 h-8 w-44 animate-pulse rounded-lg bg-gold/10" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border bg-card/40"
          />
        ))}
      </div>
    </div>
  );
}
