'use client'

import dynamic from 'next/dynamic'
import type { OccupancyByZone } from '@/lib/supabase/types'

const HourlyChart = dynamic(() => import('./HourlyChart'), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-lg bg-gray-50" />,
})

const ZoneSummaryDonut = dynamic(() => import('./ZoneSummaryDonut'), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-lg bg-gray-50" />,
})

interface HourData {
  hour: number
  count: number
}

interface Props {
  arrivals: HourData[]
  departures: HourData[]
  occupancy: OccupancyByZone[]
  /** Paneli i tretë (feed i aktiviteteve), i renderuar në server. */
  children?: React.ReactNode
}

/** Rreshti i mesëm i dashboard-it: grafiku orar, donut i zonave, feed-i i aktiviteteve. */
export default function DashboardCharts({ arrivals, departures, occupancy, children }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <div className="xl:col-span-2">
        <HourlyChart arrivals={arrivals} departures={departures} />
      </div>
      <ZoneSummaryDonut occupancy={occupancy} />
      {children}
    </div>
  )
}
