import Link from 'next/link'
import {
  LogIn,
  LogOut,
  Pencil,
  RotateCcw,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SpotEventWithDetails } from '@/lib/db/queries'
import { cn } from '@/lib/utils/cn'
import { formatLocal } from '@/lib/utils/time'

interface Props {
  events: SpotEventWithDetails[]
}

const EVENT_META: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  occupied:          { label: 'Zënie vendi',       icon: LogIn,    className: 'bg-red-50 text-red-600' },
  released:          { label: 'Lirim vendi',       icon: LogOut,   className: 'bg-green-50 text-green-600' },
  out_of_service:    { label: 'Jashtë shërbimit',  icon: Wrench,   className: 'bg-gray-100 text-gray-500' },
  restored:          { label: 'Rikthim vendi',     icon: RotateCcw, className: 'bg-blue-50 text-blue-600' },
  manual_correction: { label: 'Korrigjim manual',  icon: Pencil,   className: 'bg-amber-50 text-amber-600' },
}

/** Feed kompakt i veprimeve të fundit — versioni i plotë është te Historiku. */
export default function RecentActivityFeed({ events }: Props) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Aktivitetet e fundit</CardTitle>
        <Link
          href="/admin/history"
          className="text-xs font-medium text-primary hover:underline"
        >
          Shiko të gjitha
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {events.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">
            Nuk ka aktivitet për periudhën e zgjedhur.
          </p>
        ) : (
          <ul className="divide-y">
            {events.map((ev) => {
              const meta = EVENT_META[ev.event_type] ?? EVENT_META.manual_correction
              const Icon = meta.icon
              return (
                <li key={ev.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      meta.className,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {meta.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ev.zone_code} · {ev.spot_code}
                      {ev.performer_name ? ` — ${ev.performer_name}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatLocal(ev.performed_at, 'HH:mm')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
