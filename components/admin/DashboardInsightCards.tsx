import { AlertTriangle, Clock3, Info, RefreshCcw, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DashboardInsights } from '@/lib/db/queries'
import type { OccupancyByZone } from '@/lib/supabase/types'
import { formatDuration } from '@/lib/utils/time'

interface HourData {
  hour: number
  count: number
}

interface Props {
  insights: DashboardInsights
  occupancy: OccupancyByZone[]
  arrivals: HourData[]
  departures: HourData[]
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

function getPeakHour(arrivals: HourData[], departures: HourData[]) {
  const candidates = [
    ...arrivals.map((item) => ({ ...item, type: 'zënie' })),
    ...departures.map((item) => ({ ...item, type: 'lirime' })),
  ]

  return candidates.reduce<{ hour: number; count: number; type: string } | null>((best, item) => {
    if (!best || item.count > best.count) return item
    return best
  }, null)
}

export default function DashboardInsightCards({
  insights,
  occupancy,
  arrivals,
  departures,
  periodLabel,
}: Props) {
  const busiestZone = getBusiestZone(occupancy)
  const busiestPct = busiestZone ? Math.round(Number(busiestZone.occupancy_percentage ?? 0)) : 0
  const occupiedNow = occupancy.reduce((sum, zone) => sum + zone.occupied_count, 0)
  const mismatch = insights.active_sessions - occupiedNow
  const peak = getPeakHour(arrivals, departures)
  const peakValue = peak && peak.count > 0
    ? `${peak.hour.toString().padStart(2, '0')}:00`
    : '-'
  const peakNote = peak && peak.count > 0
    ? `${peak.count} ${peak.type}`
    : 'pa lëvizje'

  const cards = [
    {
      title: 'Qarkullim',
      value: insights.completed_sessions,
      note: 'lirime në periudhë',
      info: 'Sa parkime janë mbyllur në periudhën e filtruar. Praktikisht tregon sa herë është liruar një vend.',
      icon: RefreshCcw,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      title: 'Piku i ditës',
      value: peakValue,
      note: peakNote,
      info: 'Ora me më shumë zënie ose lirime brenda periudhës së filtruar.',
      icon: Zap,
      color: 'text-violet-700',
      bg: 'bg-violet-50',
    },
    {
      title: 'Qëndrim mesatar',
      value: formatDuration(insights.average_duration_minutes),
      note: 'për vend të mbyllur',
      info: 'Mesatarja e kohëzgjatjes për parkimet e mbyllura në periudhën e filtruar.',
      icon: Clock3,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      title: 'Zona më e ngarkuar',
      value: busiestZone ? busiestZone.zone_code : '-',
      note: busiestZone ? `${busiestPct}% zënë` : 'pa të dhëna',
      info: 'Zona që ka përqindjen më të lartë të vendeve të zëna në këtë moment.',
      icon: TrendingUp,
      color: 'text-red-700',
      bg: 'bg-red-50',
    },
  ]

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
              Kontroll: {insights.active_sessions} seanca aktive, {occupiedNow} vende të zëna.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
        {cards.map(({ title, value, note, info, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex min-h-[104px] items-start justify-between gap-2 sm:min-h-0 sm:gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1">
                    <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-sm">
                      {title}
                    </p>
                    <span
                      title={info}
                      aria-label={info}
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400"
                    >
                      <Info className="h-3 w-3" />
                    </span>
                  </div>
                  <p className={`mt-1 truncate text-xl font-bold sm:text-2xl ${color}`}>
                    {value}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:truncate sm:text-xs">
                    {note}
                  </p>
                </div>
                <div className={`shrink-0 rounded-full p-1.5 sm:p-2 ${bg}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
