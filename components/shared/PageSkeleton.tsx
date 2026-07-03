import { Skeleton } from '@/components/ui/skeleton'

/** Blloqe skeleton të ripërdorshme për faqet loading.tsx. */

export function SkeletonHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  )
}

export function SkeletonFilters() {
  return <Skeleton className="h-16 w-full rounded-lg" />
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  )
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  )
}
