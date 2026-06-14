export function LoadingState({ label = "Memuat data" }: { label?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}...</p>
    </div>
  );
}
