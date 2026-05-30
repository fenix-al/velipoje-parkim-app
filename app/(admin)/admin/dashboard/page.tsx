import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getCurrentOccupancy,
  getHourlyArrivals,
  getHourlyDepartures,
  getAverageDurationByZone,
  getTotalOccupiedMinutesByZone,
  getDashboardInsights,
  getRecentEvents,
} from '@/lib/db/queries'
import OccupancyCards from '@/components/admin/OccupancyCards'
import ActivityTable from '@/components/admin/ActivityTable'
import DashboardFilters from '@/components/admin/DashboardFilters'
import CSVExportButton from '@/components/admin/CSVExportButton'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardInsightCards from '@/components/admin/DashboardInsightCards'
import { startOfDayTirane } from '@/lib/utils/time'

export const metadata: Metadata = {
  title: 'Dashboard — Admin Parkimi',
}

export const revalidate = 30

interface Props {
  searchParams: Promise<{
    from?: string
    to?: string
    zone?: string
    event?: string
    activityPage?: string
  }>
}

function formatDateParam(value?: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function getPeriodLabel(from?: string, to?: string) {
  if (!from && !to) return 'Sot'
  if (from && to && from === to) return formatDateParam(from)
  if (from && to) return `${formatDateParam(from)} - ${formatDateParam(to)}`
  if (from) return `Nga ${formatDateParam(from)}`
  return `Deri ${formatDateParam(to)}`
}

export default async function DashboardPage({ searchParams }: Props) {
  const params    = await searchParams
  const zoneCode  = params.zone ?? ''
  const selectedZoneCode = zoneCode || undefined
  const activityPage = Math.max(1, Number(params.activityPage ?? 1) || 1)
  const activityPageSize = 20
  const eventType = params.event ?? ''
  const todayStart = startOfDayTirane()
  const from = params.from ? new Date(params.from).toISOString() : todayStart
  const to   = params.to   ? new Date(params.to + 'T23:59:59').toISOString() : new Date().toISOString()

  const [
    occupancy,
    arrivals,
    departures,
    avgDuration,
    totalMinutesByZone,
    insights,
    activity,
  ] = await Promise.all([
    getCurrentOccupancy(),
    getHourlyArrivals(from, to, selectedZoneCode),
    getHourlyDepartures(from, to, selectedZoneCode),
    getAverageDurationByZone(from, to),
    getTotalOccupiedMinutesByZone(from, to),
    getDashboardInsights(from, to, selectedZoneCode),
    getRecentEvents({
      from,
      to,
      zoneCode: selectedZoneCode,
      eventType: eventType || undefined,
      limit: activityPageSize,
      offset: (activityPage - 1) * activityPageSize,
    }),
  ])
  const filteredOccupancy = selectedZoneCode
    ? occupancy.filter((zone) => zone.zone_code === selectedZoneCode)
    : occupancy
  const filteredAvgDuration = selectedZoneCode
    ? avgDuration.filter((zone) => zone.zone_code === selectedZoneCode)
    : avgDuration
  const periodLabel = getPeriodLabel(params.from, params.to)

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
            Pamje e shpejte per zonat dhe aktivitetin.
          </p>
        </div>
        <CSVExportButton
          from={params.from}
          to={params.to}
          zoneCode={selectedZoneCode}
        />
      </div>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-white animate-pulse" />}>
        <DashboardFilters />
      </Suspense>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Statistika
        </h2>
        <div className="space-y-4">
          <DashboardInsightCards
            insights={insights}
            occupancy={filteredOccupancy}
            arrivals={arrivals}
            departures={departures}
            periodLabel={periodLabel}
          />
        <OccupancyCards
          data={filteredOccupancy}
          totalMinutesByZone={totalMinutesByZone}
          view="summary"
        />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Zonat
        </h2>
        <OccupancyCards
          data={filteredOccupancy}
          totalMinutesByZone={totalMinutesByZone}
          view="zones"
        />
      </section>

      <section>
        <DashboardCharts
          arrivals={arrivals}
          departures={departures}
          avgDuration={filteredAvgDuration}
        />
      </section>

      <section>
        <ActivityTable
          events={activity.events}
          total={activity.total}
          page={activityPage}
          pageSize={activityPageSize}
          eventType={eventType}
        />
      </section>
    </div>
  )
}
