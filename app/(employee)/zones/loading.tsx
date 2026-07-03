import { Skeleton } from '@/components/ui/skeleton'

export default function ZonesLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-2 py-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
