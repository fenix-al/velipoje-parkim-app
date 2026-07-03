import {
  SkeletonCardGrid,
  SkeletonFilters,
  SkeletonHeader,
  SkeletonStatGrid,
} from '@/components/shared/PageSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-5 md:space-y-6">
      <SkeletonHeader />
      <SkeletonFilters />
      <SkeletonStatGrid />
      <SkeletonCardGrid />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  )
}
