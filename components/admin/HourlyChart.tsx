'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HourData {
  hour: number
  count: number
}

interface Props {
  arrivals: HourData[]
  departures: HourData[]
}

function mergeHours(arrivals: HourData[], departures: HourData[]) {
  const map: Record<number, { hour: number; zënie: number; lirime: number }> = {}
  for (let h = 0; h < 24; h++) {
    map[h] = { hour: h, zënie: 0, lirime: 0 }
  }
  arrivals.forEach(({ hour, count }) => {
    map[hour].zënie = count
  })
  departures.forEach(({ hour, count }) => {
    map[hour].lirime = count
  })
  return Object.values(map).sort((a, b) => a.hour - b.hour)
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function HourlyChart({ arrivals, departures }: Props) {
  const data = mergeHours(arrivals, departures)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktiviteti sipas orës</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fontSize: 10 }}
              interval={3}
            />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => `Ora ${formatHour(Number(label))}`}
            />
            <Legend />
            <Bar dataKey="zënie"  fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="lirime" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
