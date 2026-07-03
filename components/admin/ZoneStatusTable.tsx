import Link from 'next/link'
import { Eye, LayoutGrid } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import OccupancyBar from '@/components/shared/OccupancyBar'
import { occupancyColor } from '@/lib/design/status'
import type { OccupancyByZone } from '@/lib/supabase/types'
import { formatDuration } from '@/lib/utils/time'

interface Props {
  occupancy: OccupancyByZone[]
  /** Kohëzgjatja mesatare në minuta sipas kodit të zonës. */
  avgMinutesByZone: Record<string, number>
  /** Minutat totale të zënies sipas kodit të zonës. */
  totalMinutesByZone: Record<string, number>
  /** Vetëm admini sheh lidhjen e ndryshimit të layout-it. */
  canEditLayout?: boolean
}

/** Tabela "Gjendja e zonave" — një rresht për zonë me metrikat kryesore. */
export default function ZoneStatusTable({
  occupancy,
  avgMinutesByZone,
  totalMinutesByZone,
  canEditLayout = true,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gjendja e zonave</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground">Zona</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Kapaciteti</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Të zëna</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Të lira</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Zënia %</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Qëndrim mesatar</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Orë totale</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {occupancy.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Nuk ka zona aktive.
                  </td>
                </tr>
              )}
              {occupancy.map((zone) => {
                const pct = Math.round(Number(zone.occupancy_percentage ?? 0))
                const avgMinutes = avgMinutesByZone[zone.zone_code]
                const totalMinutes = totalMinutesByZone[zone.zone_code] ?? 0
                return (
                  <tr key={zone.zone_id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: occupancyColor(pct) }}
                        />
                        <span className="font-semibold text-gray-900">{zone.zone_code}</span>
                        <span className="hidden truncate text-muted-foreground lg:inline">
                          {zone.zone_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{zone.total_spots}</td>
                    <td className="px-4 py-2.5 font-medium text-red-600">{zone.occupied_count}</td>
                    <td className="px-4 py-2.5 font-medium text-green-600">{zone.free_count}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <OccupancyBar pct={pct} className="w-20" />
                        <span className="w-9 text-xs font-semibold">{pct}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                      {avgMinutes != null ? formatDuration(avgMinutes) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                      {formatDuration(totalMinutes)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/zones/${zone.zone_id}/view`}
                          title="Shiko zonën"
                          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {canEditLayout && (
                          <Link
                            href={`/admin/zones/${zone.zone_id}/layout`}
                            title="Ndrysho vendet"
                            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
