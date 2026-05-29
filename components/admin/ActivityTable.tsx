import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLocal } from '@/lib/utils/time'
import type { SpotEventWithDetails } from '@/lib/db/queries'

interface Props {
  events: SpotEventWithDetails[]
}

const EVENT_LABELS: Record<string, string> = {
  occupied:           'Zënë',
  released:           'Liruar',
  out_of_service:     'Jashtë shërbimit',
  restored:           'Rikthyer',
  manual_correction:  'Korrigjim manual',
}

const EVENT_VARIANTS: Record<string, 'success' | 'destructive' | 'secondary' | 'warning' | 'default'> = {
  occupied:           'destructive',
  released:           'success',
  out_of_service:     'secondary',
  restored:           'default',
  manual_correction:  'warning',
}

export default function ActivityTable({ events }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktiviteti i fundit</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Koha</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Zona</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vend</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Veprimi</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Punonjësi</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nuk ka aktivitet për t'u shfaqur.
                  </td>
                </tr>
              )}
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatLocal(ev.performed_at, 'dd/MM HH:mm')}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{ev.zone_code}</td>
                  <td className="px-4 py-2.5">{ev.spot_code}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={EVENT_VARIANTS[ev.event_type] ?? 'default'}>
                      {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {ev.performer_name || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
