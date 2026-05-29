import { Metadata } from 'next'
import { getCompletedSessions } from '@/lib/db/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatLocal, formatDuration } from '@/lib/utils/time'
import CSVExportButton from '@/components/admin/CSVExportButton'
import DashboardFilters from '@/components/admin/DashboardFilters'
import { startOfDayTirane } from '@/lib/utils/time'

export const metadata: Metadata = {
  title: 'Raporte — Admin Parkimi',
}

interface Props {
  searchParams: Promise<{ from?: string; to?: string; zone?: string; page?: string }>
}

const PAGE_SIZE = 50

export default async function ReportsPage({ searchParams }: Props) {
  const params   = await searchParams
  const page     = Number(params.page ?? 1)
  const zoneCode = params.zone ?? ''
  const from     = params.from ? new Date(params.from).toISOString() : startOfDayTirane()
  const to       = params.to   ? new Date(params.to + 'T23:59:59').toISOString() : new Date().toISOString()

  const sessions = await getCompletedSessions({
    zoneCode: zoneCode || undefined,
    from,
    to,
    limit:  PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Raporte</h1>
        <CSVExportButton
          from={params.from}
          to={params.to}
          zoneCode={zoneCode || undefined}
        />
      </div>

      <DashboardFilters />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Seancat e përfunduara ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Zona</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Vend</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Zënë në</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Liruar në</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Kohëzgjatja</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Punonjësi</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nuk ka seanca për periudhën e zgjedhur.
                    </td>
                  </tr>
                )}
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Badge variant="outline">{s.zone_code}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{s.spot_code}</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {formatLocal(s.occupied_at)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {formatLocal(s.released_at)}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      {formatDuration(s.duration_minutes)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {s.occupied_by_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
