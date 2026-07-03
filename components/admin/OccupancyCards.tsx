'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertCircle, Car, Eye, LayoutGrid, ParkingSquare, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import OccupancyBadge from '@/components/shared/OccupancyBadge'
import OccupancyBar from '@/components/shared/OccupancyBar'
import StatCard from '@/components/shared/StatCard'
import { occupancyColor } from '@/lib/design/status'
import type { OccupancyByZone } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'
import { formatDuration } from '@/lib/utils/time'

interface Props {
  data: OccupancyByZone[]
  totalMinutesByZone: Record<string, number>
  view?: 'all' | 'summary' | 'zones'
}

function ZoneCard({
  zone,
  totalMinutes,
}: {
  zone: OccupancyByZone
  totalMinutes: number
}) {
  const pct = Number(zone.occupancy_percentage)
  const color = occupancyColor(pct)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="border-b bg-gradient-to-br from-white to-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                {zone.zone_code}
              </span>
              <OccupancyBadge pct={pct} />
            </div>
            <CardTitle className="truncate text-base leading-tight">{zone.zone_name}</CardTitle>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              color,
              background: `conic-gradient(${color} ${pct * 3.6}deg, #eef2f7 0deg)`,
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              {Math.round(pct)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border bg-red-50/60 p-3">
            <p className="text-xs text-muted-foreground">Të zëna</p>
            <p className="mt-1 text-xl font-bold text-red-600">{zone.occupied_count}</p>
          </div>
          <div className="rounded-md border bg-green-50/60 p-3">
            <p className="text-xs text-muted-foreground">Të lira</p>
            <p className="mt-1 text-xl font-bold text-green-600">{zone.free_count}</p>
          </div>
          <div className="rounded-md border bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Gjithsej</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{zone.total_spots}</p>
          </div>
          <div className="rounded-md border bg-blue-50/60 p-3">
            <p className="text-xs text-muted-foreground">Orë totale</p>
            <p className="mt-1 text-base font-bold text-blue-700">{formatDuration(totalMinutes)}</p>
          </div>
        </div>

        <OccupancyBar pct={pct} showLabel />
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 border-t bg-slate-50/70 p-3">
        <Button asChild variant="outline" size="sm" className="h-9 px-2 text-xs sm:text-sm">
          <Link href={`/zones/${zone.zone_code}`}>
            <Eye className="h-4 w-4" />
            Shiko
          </Link>
        </Button>
        <Button asChild size="sm" className="h-9 px-2 text-xs sm:text-sm">
          <Link href={`/admin/zones/${zone.zone_id}/layout`}>
            <LayoutGrid className="h-4 w-4" />
            Ndrysho layout
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function OccupancyCards({ data, totalMinutesByZone, view = 'all' }: Props) {
  const [selectedZoneId, setSelectedZoneId] = useState(data[0]?.zone_id ?? '')

  const totals = data.reduce(
    (acc, z) => ({
      total:    acc.total    + z.total_spots,
      occupied: acc.occupied + z.occupied_count,
      free:     acc.free     + z.free_count,
      oos:      acc.oos      + z.out_of_service_count,
    }),
    { total: 0, occupied: 0, free: 0, oos: 0 },
  )

  const selectedZone = useMemo(
    () => data.find((zone) => zone.zone_id === selectedZoneId) ?? data[0],
    [data, selectedZoneId],
  )

  const activeSpotsTotal = totals.total - totals.oos
  const overallPct = activeSpotsTotal > 0
    ? Math.round((totals.occupied / activeSpotsTotal) * 100)
    : 0

  const showSummary = view === 'all' || view === 'summary'
  const showZones = view === 'all' || view === 'zones'

  return (
    <div className="space-y-4">
      {showSummary && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <StatCard title="Të zëna" value={totals.occupied} icon={Car} tone="red" />
          <StatCard title="Të lira" value={totals.free} icon={ParkingSquare} tone="green" />
          <StatCard title="Zënia %" value={`${overallPct}%`} icon={Percent} tone="blue" />
          <StatCard title="Jashtë shërbimit" value={totals.oos} icon={AlertCircle} tone="gray" />
        </div>
      )}

      {showZones && data.length > 0 && (
        <div className="space-y-3 md:hidden">
          <div className="-mx-3 overflow-x-auto px-3">
            <div className="flex min-w-max gap-2">
              {data.map((zone) => (
                <button
                  key={zone.zone_id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.zone_id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    selectedZone?.zone_id === zone.zone_id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-gray-200 bg-white text-gray-600',
                  )}
                >
                  {zone.zone_code}
                </button>
              ))}
            </div>
          </div>
          {selectedZone && (
            <ZoneCard
              zone={selectedZone}
              totalMinutes={totalMinutesByZone[selectedZone.zone_code] ?? 0}
            />
          )}
        </div>
      )}

      {showZones && (
      <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
        {data.map((zone) => (
          <ZoneCard
            key={zone.zone_id}
            zone={zone}
            totalMinutes={totalMinutesByZone[zone.zone_code] ?? 0}
          />
        ))}
      </div>
      )}
    </div>
  )
}
