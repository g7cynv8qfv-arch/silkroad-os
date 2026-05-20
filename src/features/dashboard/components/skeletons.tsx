import { Skeleton } from '@/components/ui/skeleton';

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-5 shadow-xs">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-1 h-10 w-full" />
    </div>
  );
}

export function StatCardRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartPanelSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-56" />
      <Skeleton className="mt-2 h-52 w-full rounded-lg" />
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="mt-0.5 h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiInsightsSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-4">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
