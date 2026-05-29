import { Metadata } from 'next'
import {
  getCurrentOccupancy,
  getHourlyArrivals,
  getHourlyDepartures,
  getAverageDurationByZone,
  getRecentEvents,
} from '@/lib/db/queries'
import OccupancyCards from '@/components/admin/OccupancyCards'
import ActivityTable from '@/components/admin/ActivityTable'
import DashboardFilters from '@/components/admin/DashboardFilters'
import CSVExportButton from '@/components/admin/CSVExportButton'
import DashboardCharts from '@/components/admin/DashboardCharts'
import { startOfDayTirane } from '@/lib/utils/time'

export const metadata: Metadata = {
  title: 'Dashboard — Admin Parkimi',
}

export const revalidate = 30

interface Props {
  searchParams: Promise<{ from?: string; to?: string; zone?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const params    = await searchParams
  const zoneCode  = params.zone ?? ''
  const todayStart = startOfDayTirane()
  const from = params.from ? new Date(params.from).toISOString() : todayStart
  const to   = params.to   ? new Date(params.to + 'T23:59:59').toISOString() : new Date().toISOString()

  const [occupancy, arrivals, departures, avgDuration, events] = await Promise.all([
    getCurrentOccupancy(),
    getHourlyArrivals(from, to, zoneCode || undefined),
    getHourlyDepartures(from, to, zoneCode || undefined),
    getAverageDurationByZone(from, to),
    getRecentEvents(30),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <CSVExportButton
          from={params.from}
          to={params.to}
          zoneCode={zoneCode || undefined}
        />
      </div>

      <DashboardFilters />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Gjendja aktuale
        </h2>
        <OccupancyCards data={occupancy} />
      </section>

      <section>
        <DashboardCharts
          arrivals={arrivals}
          departures={departures}
          avgDuration={avgDuration}
        />
      </section>

      <section>
        <ActivityTable events={events} />
      </section>
    </div>
  )
}
