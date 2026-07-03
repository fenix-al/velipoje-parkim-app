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
import PageHeader from '@/components/shared/PageHeader'
import { getProfile } from '@/lib/supabase/server'
import DashboardFilters from '@/components/admin/DashboardFilters'
import CSVExportButton from '@/components/admin/CSVExportButton'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardInsightCards from '@/components/admin/DashboardInsightCards'
import RecentActivityFeed from '@/components/admin/RecentActivityFeed'
import ZoneStatusTable from '@/components/admin/ZoneStatusTable'
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
  const todayStart = startOfDayTirane()
  const from = params.from ? new Date(params.from).toISOString() : todayStart
  const to   = params.to   ? new Date(params.to + 'T23:59:59').toISOString() : new Date().toISOString()

  const [
    profile,
    occupancy,
    arrivals,
    departures,
    avgDuration,
    totalMinutesByZone,
    insights,
    activity,
  ] = await Promise.all([
    getProfile(),
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
      limit: 8,
      offset: 0,
    }),
  ])
  const filteredOccupancy = selectedZoneCode
    ? occupancy.filter((zone) => zone.zone_code === selectedZoneCode)
    : occupancy
  const avgMinutesByZone = Object.fromEntries(
    avgDuration.map((z) => [z.zone_code, z.avg_minutes]),
  )
  const periodLabel = getPeriodLabel(params.from, params.to)

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="Dashboard"
        description="Përmbledhje e përgjithshme e parkimit në kohë reale."
      >
        <CSVExportButton
          from={params.from}
          to={params.to}
          zoneCode={selectedZoneCode}
        />
      </PageHeader>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-white animate-pulse" />}>
        <DashboardFilters />
      </Suspense>

      <DashboardInsightCards
        insights={insights}
        occupancy={filteredOccupancy}
        periodLabel={periodLabel}
      />

      <DashboardCharts
        arrivals={arrivals}
        departures={departures}
        occupancy={filteredOccupancy}
      >
        <RecentActivityFeed events={activity.events} />
      </DashboardCharts>

      <ZoneStatusTable
        occupancy={filteredOccupancy}
        avgMinutesByZone={avgMinutesByZone}
        totalMinutesByZone={totalMinutesByZone}
        canEditLayout={profile?.role === 'admin'}
      />
    </div>
  )
}
