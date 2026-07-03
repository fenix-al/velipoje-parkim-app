'use client'

import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_CATEGORICAL } from '@/lib/design/status'
import type { OccupancyByZone } from '@/lib/supabase/types'

interface Props {
  occupancy: OccupancyByZone[]
}

/** Donut me shpërndarjen e kapacitetit sipas zonave + listë me zënien e secilës. */
export default function ZoneSummaryDonut({ occupancy }: Props) {
  const totalSpots = occupancy.reduce((sum, z) => sum + z.total_spots, 0)
  const data = occupancy.map((z, i) => ({
    name: z.zone_code,
    value: z.total_spots,
    color: CHART_CATEGORICAL[i % CHART_CATEGORICAL.length],
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Përmbledhje e zonave</CardTitle>
        <Link
          href="/admin/zones"
          className="text-xs font-medium text-primary hover:underline"
        >
          Shiko të gjitha
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="relative h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} vende`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{totalSpots}</span>
            <span className="text-[11px] text-muted-foreground">vende gjithsej</span>
          </div>
        </div>

        <ul className="mt-3 space-y-2">
          {occupancy.map((zone, i) => {
            const pct = Math.round(Number(zone.occupancy_percentage ?? 0))
            return (
              <li key={zone.zone_id} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_CATEGORICAL[i % CHART_CATEGORICAL.length] }}
                />
                <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                  {zone.zone_code} — {zone.zone_name}
                </span>
                <span className="font-semibold text-gray-700">{pct}%</span>
                <span className="w-16 text-right text-muted-foreground">
                  {zone.occupied_count} / {zone.total_spots}
                </span>
              </li>
            )
          })}
          {occupancy.length === 0 && (
            <li className="py-4 text-center text-xs text-muted-foreground">
              Nuk ka zona aktive.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
