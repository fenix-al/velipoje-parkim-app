import { Car, ParkingSquare, Percent, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OccupancyByZone } from '@/lib/supabase/types'

interface Props {
  data: OccupancyByZone[]
}

export default function OccupancyCards({ data }: Props) {
  const totals = data.reduce(
    (acc, z) => ({
      total:    acc.total    + z.total_spots,
      occupied: acc.occupied + z.occupied_count,
      free:     acc.free     + z.free_count,
      oos:      acc.oos      + z.out_of_service_count,
    }),
    { total: 0, occupied: 0, free: 0, oos: 0 }
  )

  const activeSpotsTotal = totals.total - totals.oos
  const overallPct = activeSpotsTotal > 0
    ? Math.round((totals.occupied / activeSpotsTotal) * 100)
    : 0

  const summaryCards = [
    {
      title:   'Të zëna',
      value:   totals.occupied,
      icon:    Car,
      color:   'text-red-600',
      bg:      'bg-red-50',
    },
    {
      title:   'Të lira',
      value:   totals.free,
      icon:    ParkingSquare,
      color:   'text-green-600',
      bg:      'bg-green-50',
    },
    {
      title:   'Zënia %',
      value:   `${overallPct}%`,
      icon:    Percent,
      color:   'text-blue-600',
      bg:      'bg-blue-50',
    },
    {
      title:   'Jashtë shërbimit',
      value:   totals.oos,
      icon:    AlertCircle,
      color:   'text-gray-600',
      bg:      'bg-gray-50',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`rounded-full p-2 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-zone breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {data.map((zone) => {
          const pct = Number(zone.occupancy_percentage)
          return (
            <Card key={zone.zone_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{zone.zone_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Të zëna</span>
                  <span className="font-semibold text-red-600">{zone.occupied_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Të lira</span>
                  <span className="font-semibold text-green-600">{zone.free_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gjithsej</span>
                  <span className="font-semibold">{zone.total_spots}</span>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Zënia</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
