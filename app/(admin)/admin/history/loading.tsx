import {
  SkeletonFilters,
  SkeletonHeader,
  SkeletonTable,
} from '@/components/shared/PageSkeleton'

export default function HistoryLoading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <SkeletonFilters />
      <SkeletonTable rows={12} />
    </div>
  )
}
