import {
  SkeletonFilters,
  SkeletonHeader,
  SkeletonStatGrid,
  SkeletonTable,
} from '@/components/shared/PageSkeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <SkeletonFilters />
      <SkeletonStatGrid />
      <SkeletonTable rows={10} />
    </div>
  )
}
