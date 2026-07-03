'use server'

import { format } from 'date-fns'
import {
  getAverageDurationByZone,
  getCompletedSessionsPage,
  getCompletedSessionsStats,
  getCurrentOccupancy,
  getDashboardInsights,
  getRecentEvents,
  getTotalOccupiedMinutesByZone,
  type SessionsFilter,
} from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import { formatDuration, formatLocal, startOfDayTirane } from '@/lib/utils/time'
import type { ExportPayload } from '@/lib/export/types'

/** Maksimumi i rreshtave për një eksport — mban skedarët të hapshëm. */
const EXPORT_ROW_LIMIT = 5000

const EVENT_LABELS: Record<string, string> = {
  occupied: 'Zënë',
  released: 'Liruar',
  out_of_service: 'Jashtë shërbimit',
  restored: 'Rikthyer',
  manual_correction: 'Korrigjim manual',
}

async function requirePanelRole() {
  const profile = await getProfile()
  const allowed = profile?.role === 'admin' || profile?.role === 'supervisor'
  if (!profile || !allowed || !profile.is_active) throw new Error('Unauthorized')
  return profile
}

/** Njësoj si faqet: default = sot nga fillimi i ditës deri tani (Europe/Tirane). */
function resolveRange(from?: string, to?: string) {
  return {
    fromISO: from ? new Date(from).toISOString() : startOfDayTirane(),
    toISO: to ? new Date(to + 'T23:59:59').toISOString() : new Date().toISOString(),
  }
}

function formatDateParam(value?: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function periodLabel(from?: string, to?: string) {
  if (!from && !to) return 'Sot'
  if (from && to && from === to) return formatDateParam(from)
  if (from && to) return `${formatDateParam(from)} - ${formatDateParam(to)}`
  if (from) return `Nga ${formatDateParam(from)}`
  return `Deri ${formatDateParam(to)}`
}

function fileStamp() {
  return format(new Date(), 'yyyy-MM-dd')
}

interface DashboardExportParams {
  from?: string
  to?: string
  zone?: string
}

export async function getDashboardExport(
  params: DashboardExportParams
): Promise<ExportPayload> {
  await requirePanelRole()
  const { fromISO, toISO } = resolveRange(params.from, params.to)
  const zoneCode = params.zone || undefined

  const [occupancy, avgDuration, totalMinutesByZone, insights] = await Promise.all([
    getCurrentOccupancy(),
    getAverageDurationByZone(fromISO, toISO),
    getTotalOccupiedMinutesByZone(fromISO, toISO),
    getDashboardInsights(fromISO, toISO, zoneCode),
  ])

  const zones = zoneCode
    ? occupancy.filter((z) => z.zone_code === zoneCode)
    : occupancy
  const avgByZone = Object.fromEntries(
    avgDuration.map((z) => [z.zone_code, z.avg_minutes]),
  )

  const totals = zones.reduce(
    (acc, z) => ({
      total: acc.total + z.total_spots,
      occupied: acc.occupied + z.occupied_count,
      free: acc.free + z.free_count,
      oos: acc.oos + z.out_of_service_count,
    }),
    { total: 0, occupied: 0, free: 0, oos: 0 },
  )
  const activeSpots = totals.total - totals.oos
  const pct = activeSpots > 0 ? Math.round((totals.occupied / activeSpots) * 100) : 0

  return {
    title: 'Dashboard — Parkimi Velipojë',
    subtitle: `Periudha: ${periodLabel(params.from, params.to)}${zoneCode ? ` · Zona: ${zoneCode}` : ''}`,
    summary: [
      { label: 'Vende gjithsej', value: String(totals.total) },
      { label: 'Të zëna tani', value: String(totals.occupied) },
      { label: 'Të lira tani', value: String(totals.free) },
      { label: 'Jashtë shërbimit', value: String(totals.oos) },
      { label: 'Shkalla e zënies', value: `${pct}%` },
      { label: 'Qarkullim (lirime në periudhë)', value: String(insights.completed_sessions) },
      { label: 'Qëndrim mesatar', value: formatDuration(insights.average_duration_minutes) },
    ],
    tables: [
      {
        name: 'Gjendja e zonave',
        columns: [
          { header: 'Zona', key: 'code', width: 10 },
          { header: 'Emri', key: 'name', width: 28 },
          { header: 'Kapaciteti', key: 'total', width: 12 },
          { header: 'Të zëna', key: 'occupied', width: 10 },
          { header: 'Të lira', key: 'free', width: 10 },
          { header: 'Jashtë shërbimit', key: 'oos', width: 16 },
          { header: 'Zënia %', key: 'pct', width: 10 },
          { header: 'Qëndrim mesatar', key: 'avg', width: 16 },
          { header: 'Orë totale', key: 'hours', width: 12 },
        ],
        rows: zones.map((z) => ({
          code: z.zone_code,
          name: z.zone_name,
          total: z.total_spots,
          occupied: z.occupied_count,
          free: z.free_count,
          oos: z.out_of_service_count,
          pct: `${Math.round(Number(z.occupancy_percentage ?? 0))}%`,
          avg: avgByZone[z.zone_code] != null ? formatDuration(avgByZone[z.zone_code]) : '—',
          hours: formatDuration(totalMinutesByZone[z.zone_code] ?? 0),
        })),
      },
    ],
    orientation: 'landscape',
    fileName: `dashboard-parkimi-${fileStamp()}`,
  }
}

interface ReportsExportParams {
  from?: string
  to?: string
  zone?: string
  employee?: string
  minDuration?: string
  sort?: string
}

export async function getReportsExport(
  params: ReportsExportParams
): Promise<ExportPayload> {
  await requirePanelRole()
  const { fromISO, toISO } = resolveRange(params.from, params.to)

  const filter: SessionsFilter = {
    zoneCode: params.zone || undefined,
    from: fromISO,
    to: toISO,
    employeeId: params.employee || undefined,
    minDuration: Number(params.minDuration ?? 0) || undefined,
    sort: params.sort === 'longest' ? 'longest' : 'latest',
  }

  const [page, stats] = await Promise.all([
    getCompletedSessionsPage({ ...filter, limit: EXPORT_ROW_LIMIT, offset: 0 }),
    getCompletedSessionsStats(filter),
  ])

  const truncated = page.total > page.sessions.length

  return {
    title: 'Raporte — Parkimi Velipojë',
    subtitle: `Periudha: ${periodLabel(params.from, params.to)}${params.zone ? ` · Zona: ${params.zone}` : ''}${
      truncated ? ` · Shfaqen ${page.sessions.length} nga ${page.total} seanca` : ''
    }`,
    summary: [
      { label: 'Totali i seancave', value: String(stats.total_sessions) },
      { label: 'Orë totale', value: formatDuration(stats.total_duration_minutes) },
      { label: 'Qëndrim mesatar', value: formatDuration(stats.average_duration_minutes) },
      {
        label: 'Zona kryesore',
        value: stats.top_zone_code
          ? `${stats.top_zone_code} (${stats.top_zone_sessions} seanca)`
          : '—',
      },
    ],
    tables: [
      {
        name: 'Seancat',
        columns: [
          { header: 'Zona', key: 'zone', width: 10 },
          { header: 'Vendi', key: 'spot', width: 10 },
          { header: 'Zënë në', key: 'occupied_at', width: 18 },
          { header: 'Liruar në', key: 'released_at', width: 18 },
          { header: 'Kohëzgjatja', key: 'duration', width: 14 },
          { header: 'Punonjësi', key: 'employee', width: 24 },
        ],
        rows: page.sessions.map((s) => ({
          zone: s.zone_code,
          spot: s.spot_code,
          occupied_at: formatLocal(s.occupied_at, 'dd/MM/yyyy HH:mm'),
          released_at: formatLocal(s.released_at, 'dd/MM/yyyy HH:mm'),
          duration: formatDuration(s.duration_minutes),
          employee: s.occupied_by_name ?? '—',
        })),
      },
    ],
    orientation: 'portrait',
    fileName: `raporte-parkimi-${fileStamp()}`,
  }
}

interface HistoryExportParams {
  from?: string
  to?: string
  zone?: string
  event?: string
}

export async function getHistoryExport(
  params: HistoryExportParams
): Promise<ExportPayload> {
  await requirePanelRole()
  const fromISO = params.from ? new Date(params.from).toISOString() : undefined
  const toISO = params.to ? new Date(params.to + 'T23:59:59').toISOString() : undefined

  const activity = await getRecentEvents({
    from: fromISO,
    to: toISO,
    zoneCode: params.zone || undefined,
    eventType: params.event || undefined,
    limit: EXPORT_ROW_LIMIT,
    offset: 0,
  })

  const truncated = activity.total > activity.events.length

  return {
    title: 'Historiku i veprimeve — Parkimi Velipojë',
    subtitle: `Periudha: ${params.from || params.to ? periodLabel(params.from, params.to) : 'Të gjitha'}${
      params.zone ? ` · Zona: ${params.zone}` : ''
    }${params.event ? ` · Veprimi: ${EVENT_LABELS[params.event] ?? params.event}` : ''}${
      truncated ? ` · Shfaqen ${activity.events.length} nga ${activity.total} veprime` : ''
    }`,
    summary: [
      { label: 'Numri i veprimeve', value: String(activity.total) },
    ],
    tables: [
      {
        name: 'Veprimet',
        columns: [
          { header: 'Koha', key: 'time', width: 18 },
          { header: 'Zona', key: 'zone', width: 10 },
          { header: 'Vendi', key: 'spot', width: 10 },
          { header: 'Veprimi', key: 'event', width: 18 },
          { header: 'Punonjësi', key: 'employee', width: 24 },
        ],
        rows: activity.events.map((ev) => ({
          time: formatLocal(ev.performed_at, 'dd/MM/yyyy HH:mm'),
          zone: ev.zone_code,
          spot: ev.spot_code,
          event: EVENT_LABELS[ev.event_type] ?? ev.event_type,
          employee: ev.performer_name || '—',
        })),
      },
    ],
    orientation: 'portrait',
    fileName: `historiku-parkimi-${fileStamp()}`,
  }
}
