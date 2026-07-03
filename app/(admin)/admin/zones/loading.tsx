import { SkeletonCardGrid, SkeletonHeader } from '@/components/shared/PageSkeleton'

export default function AdminZonesLoading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <SkeletonCardGrid count={6} />
    </div>
  )
}
