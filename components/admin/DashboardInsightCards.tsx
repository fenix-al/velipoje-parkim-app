import {
  AlertCircle,
  AlertTriangle,
  Car,
  Clock3,
  ParkingSquare,
  Percent,
  TrendingUp,
} from 'lucide-react'
import StatCard from '@/components/shared/StatCard'
import type { DashboardInsights } from '@/lib/db/queries'
import type { OccupancyByZone } from '@/lib/supabase/types'
import { formatDuration } from '@/lib/utils/time'

interface Props {
  insights: DashboardInsights
  occupancy: OccupancyByZone[]
  periodLabel: string
}

function getBusiestZone(occupancy: OccupancyByZone[]) {
  return occupancy.reduce<OccupancyByZone | null>((best, zone) => {
    if (!best) return zone

    const zonePct = Number(zone.occupancy_percentage ?? 0)
    const bestPct = Number(best.occupancy_percentage ?? 0)

    if (zonePct > bestPct) return zone
    if (zonePct === bestPct && zone.occupied_count > best.occupied_count) return zone

    return best
  }, null)
}

/** Rreshti kryesor i KPI-ve të dashboard-it — 6 karta në një rresht në desktop. */
export default function DashboardInsightCards({ insights, occupancy, periodLabel }: Props) {
  const totals = occupancy.reduce(
    (acc, z) => ({
      total:    acc.total    + z.total_spots,
      occupied: acc.occupied + z.occupied_count,
      free:     acc.free     + z.free_count,
      oos:      acc.oos      + z.out_of_service_count,
    }),
    { total: 0, occupied: 0, free: 0, oos: 0 },
  )
  const activeSpots = totals.total - totals.oos
  const overallPct = activeSpots > 0
    ? Math.round((totals.occupied / activeSpots) * 100)
    : 0

  const busiestZone = getBusiestZone(occupancy)
  const busiestPct = busiestZone ? Math.round(Number(busiestZone.occupancy_percentage ?? 0)) : 0
  const mismatch = insights.active_sessions - totals.occupied

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Periudha: <span className="text-gray-900">{periodLabel}</span>
        </p>
        {mismatch !== 0 && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Kontroll: {insights.active_sessions} seanca aktive, {totals.occupied} vende të zëna.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Të zëna"
          value={totals.occupied}
          note="vende"
          icon={Car}
          tone="red"
        />
        <StatCard
          title="Të lira"
          value={totals.free}
          note="vende"
          icon={ParkingSquare}
          tone="green"
        />
        <StatCard
          title="Zënia"
          value={`${overallPct}%`}
          note="e kapacitetit aktiv"
          icon={Percent}
          tone="blue"
        />
        <StatCard
          title="Qëndrim mesatar"
          value={formatDuration(insights.average_duration_minutes)}
          note="për seancë"
          info="Mesatarja e kohëzgjatjes për parkimet e mbyllura në periudhën e filtruar."
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          title="Zona më e ngarkuar"
          value={busiestZone ? busiestZone.zone_code : '-'}
          note={busiestZone ? `${busiestPct}% zënë` : 'pa të dhëna'}
          icon={TrendingUp}
          tone="violet"
        />
        <StatCard
          title="Jashtë shërbimit"
          value={totals.oos}
          note="vende"
          icon={AlertCircle}
          tone="gray"
        />
      </div>
    </div>
  )
}
