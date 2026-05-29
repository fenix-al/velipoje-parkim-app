import { Metadata } from 'next'
import { getRecentEvents } from '@/lib/db/queries'
import ActivityTable from '@/components/admin/ActivityTable'
import DashboardFilters from '@/components/admin/DashboardFilters'

export const metadata: Metadata = {
  title: 'Historiku — Admin Parkimi',
}

export default async function HistoryPage() {
  const events = await getRecentEvents(100)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Historiku i veprimeve</h1>
      <DashboardFilters />
      <ActivityTable events={events} />
    </div>
  )
}
