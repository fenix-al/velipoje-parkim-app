import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CSVExportButton from '@/components/admin/CSVExportButton'
import DashboardFilters from '@/components/admin/DashboardFilters'
import ReportsExtraFilters from '@/components/admin/ReportsExtraFilters'
import ReportsPagination from '@/components/admin/ReportsPagination'
import {
  getAllProfiles,
  getCompletedSessionsPage,
  getCompletedSessionsStats,
  type SessionsFilter,
} from '@/lib/db/queries'
import { formatDuration, formatLocal, startOfDayTirane } from '@/lib/utils/time'
import { Clock3, FileText, Timer, Trophy } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Raporte - Admin Parkimi',
}

interface Props {
  searchParams: Promise<{
    from?: string
    to?: string
    zone?: string
    page?: string
    employee?: string
    minDuration?: string
    sort?: string
  }>
}

const PAGE_SIZE = 50

function formatDateParam(value?: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function getPeriodLabel(from?: string, to?: string) {
  if (!from && !to) return 'Sot'
  if (from && to && from === to) return formatDateParam(from)
  if (from && to) return `${formatDateParam(from)} - ${formatDateParam(to)}`
  if (from) return `Nga ${formatDateParam(from)}`
  return `Deri ${formatDateParam(to)}`
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const zoneCode = params.zone ?? ''
  const minDuration = Number(params.minDuration ?? 0) || undefined
  const sort: SessionsFilter['sort'] = params.sort === 'longest' ? 'longest' : 'latest'
  const from = params.from ? new Date(params.from).toISOString() : startOfDayTirane()
  const to = params.to ? new Date(params.to + 'T23:59:59').toISOString() : new Date().toISOString()
  const filter: SessionsFilter = {
    zoneCode: zoneCode || undefined,
    from,
    to,
    employeeId: params.employee || undefined,
    minDuration,
    sort,
  }

  const [completedPage, stats, profiles] = await Promise.all([
    getCompletedSessionsPage({
      ...filter,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    getCompletedSessionsStats(filter),
    getAllProfiles(),
  ])
  const sessions = completedPage.sessions
  const total = completedPage.total
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)
  const periodLabel = getPeriodLabel(params.from, params.to)
  const employees = profiles.filter((profile) => profile.role === 'employee')

  const statCards = [
    {
      title: 'Totali i seancave',
      value: stats.total_sessions,
      note: 'për periudhën',
      icon: FileText,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      title: 'Orë totale',
      value: formatDuration(stats.total_duration_minutes),
      note: 'kohë përdorimi',
      icon: Timer,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Qëndrim mesatar',
      value: formatDuration(stats.average_duration_minutes),
      note: 'për seancë',
      icon: Clock3,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      title: 'Zona kryesore',
      value: stats.top_zone_code ?? '-',
      note: stats.top_zone_code ? `${stats.top_zone_sessions} seanca` : 'pa të dhëna',
      icon: Trophy,
      color: 'text-red-700',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Raporte</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
            Analizë e seancave të mbyllura.
          </p>
        </div>
        <CSVExportButton
          from={params.from}
          to={params.to}
          zoneCode={zoneCode || undefined}
        />
      </div>

      <DashboardFilters />
      <ReportsExtraFilters employees={employees} />

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {statCards.map(({ title, value, note, icon: Icon, color, bg }) => (
          <Card key={title} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                    {title}
                  </p>
                  <p className={`mt-1 truncate text-lg font-bold leading-none sm:text-2xl ${color}`}>
                    {value}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">
                    {note}
                  </p>
                </div>
                <div className={`shrink-0 rounded-full p-2 sm:p-2.5 ${bg}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seancat e përfunduara - {periodLabel}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {total === 0 ? '0 rezultate' : `Shfaqen ${firstItem}-${lastItem} nga ${total}`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y md:hidden">
            {sessions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nuk ka seanca për periudhën e zgjedhur.
              </div>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.zone_code}</Badge>
                      <p className="font-semibold text-gray-900">{s.spot_code}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {s.occupied_by_name}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {formatDuration(s.duration_minutes)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Zënë në</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatLocal(s.occupied_at, 'dd/MM HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Liruar në</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {formatLocal(s.released_at, 'dd/MM HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">Zona</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">Vend</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">Zënë në</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">Liruar në</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">Kohëzgjatja</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-muted-foreground">Punonjësi</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                      {formatLocal(s.occupied_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
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
          <ReportsPagination page={page} pageSize={PAGE_SIZE} total={total} />
        </CardContent>
      </Card>
    </div>
  )
}
