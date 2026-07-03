import { Metadata } from 'next'
import { getRecentEvents } from '@/lib/db/queries'
import ActivityTable from '@/components/admin/ActivityTable'
import DashboardFilters from '@/components/admin/DashboardFilters'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Historiku - Admin Parkimi',
}

interface Props {
  searchParams: Promise<{
    from?: string
    to?: string
    zone?: string
    event?: string
    activityPage?: string
  }>
}

export default async function HistoryPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, Number(params.activityPage ?? 1) || 1)
  const pageSize = 20
  const from = params.from ? new Date(params.from).toISOString() : undefined
  const to = params.to ? new Date(params.to + 'T23:59:59').toISOString() : undefined
  const activity = await getRecentEvents({
    from,
    to,
    zoneCode: params.zone || undefined,
    eventType: params.event || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Historiku i veprimeve"
        description="Të gjitha zëniet, lirimet dhe ndryshimet e statusit."
      />
      <DashboardFilters />
      <ActivityTable
        events={activity.events}
        total={activity.total}
        page={page}
        pageSize={pageSize}
        eventType={params.event ?? ''}
      />
    </div>
  )
}
