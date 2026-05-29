'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/utils/time'

interface Props {
  data: { zone_code: string; avg_minutes: number }[]
}

const ZONE_COLORS: Record<string, string> = {
  Z1: '#3b82f6',
  Z2: '#22c55e',
  Z3: '#f59e0b',
  Z4: '#ef4444',
}

export default function AvgDurationChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kohëzgjatja mesatare sipas zonës</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="zone_code" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${v}min`}
            />
            <Tooltip
              formatter={(value) => [formatDuration(Number(value ?? 0)), 'Mesatare']}
            />
            <Bar dataKey="avg_minutes" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.zone_code}
                  fill={ZONE_COLORS[entry.zone_code] ?? '#6b7280'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
