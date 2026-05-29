'use client'

import dynamic from 'next/dynamic'

const HourlyChart = dynamic(() => import('./HourlyChart'), {
  ssr: false,
  loading: () => <div className="h-[260px] bg-gray-50 rounded-lg animate-pulse" />,
})

const AvgDurationChart = dynamic(() => import('./AvgDurationChart'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-50 rounded-lg animate-pulse" />,
})

interface HourData {
  hour: number
  count: number
}

interface Props {
  arrivals: HourData[]
  departures: HourData[]
  avgDuration: { zone_code: string; avg_minutes: number }[]
}

export default function DashboardCharts({ arrivals, departures, avgDuration }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <HourlyChart arrivals={arrivals} departures={departures} />
      <AvgDurationChart data={avgDuration} />
    </div>
  )
}
