import { SkeletonHeader, SkeletonTable } from '@/components/shared/PageSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function UsersLoading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <Skeleton className="h-48 w-full rounded-lg" />
      <SkeletonTable rows={8} />
    </div>
  )
}
