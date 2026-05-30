import { createClient } from '@/lib/supabase/server'
import type {
  Zone,
  ParkingSpot,
  ZoneRowWithSpots,
  OccupancyByZone,
  CompletedSession,
  ActiveSession,
  SpotEvent,
  Profile,
} from '@/lib/supabase/types'

// ============================================================
// ZONES
// ============================================================

export async function getActiveZones(): Promise<Zone[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('is_active', true)
    .order('code')

  if (error) throw error
  return (data as Zone[]) ?? []
}

export async function getZoneByCode(code: string): Promise<Zone | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data as Zone
}

export async function getZoneById(id: string): Promise<Zone | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Zone
}

export async function getAllZones(): Promise<Zone[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .order('code')

  if (error) throw error
  return (data as Zone[]) ?? []
}

// ============================================================
// PARKING SPOTS
// ============================================================

export async function getSpotsByZone(zoneId: string): Promise<ParkingSpot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('parking_spots')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('spot_code')

  if (error) throw error
  return (data as ParkingSpot[]) ?? []
}

/**
 * Grid layout for a zone: ordered rows, each with its ordered spots.
 * Used by both the employee grid view and the admin layout editor.
 */
export async function getZoneLayout(zoneId: string): Promise<ZoneRowWithSpots[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zone_rows')
    .select('*, spots:parking_spots(*)')
    .eq('zone_id', zoneId)
    .order('position', { ascending: true })

  if (error) throw error

  const rows = (data as ZoneRowWithSpots[]) ?? []
  // Order spots within each row; the embedded select does not guarantee order.
  for (const row of rows) {
    row.spots = (row.spots ?? [])
      .filter((s) => s.is_active)
      .sort((a, b) => a.position - b.position)
  }
  return rows
}

export async function getActiveSessionsByZone(zoneId: string): Promise<ActiveSession[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_active_sessions')
    .select('*')
    .eq('zone_id', zoneId)

  if (error) throw error
  return (data as ActiveSession[]) ?? []
}

// ============================================================
// ADMIN: OCCUPANCY STATS
// ============================================================

export async function getCurrentOccupancy(): Promise<OccupancyByZone[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_current_occupancy_by_zone')
    .select('*')

  if (error) throw error
  return (data as OccupancyByZone[]) ?? []
}

export interface SessionsFilter {
  zoneCode?: string
  from?: string
  to?: string
  employeeId?: string
  minDuration?: number
  sort?: 'latest' | 'longest'
  limit?: number
  offset?: number
}

export async function getCompletedSessions(
  filter: SessionsFilter = {}
): Promise<CompletedSession[]> {
  const supabase = await createClient()
  let query = supabase
    .from('v_completed_sessions')
    .select('*')
    .order('occupied_at', { ascending: false })

  if (filter.zoneCode) query = query.eq('zone_code', filter.zoneCode)
  if (filter.from)     query = query.gte('occupied_at', filter.from)
  if (filter.to)       query = query.lte('occupied_at', filter.to)
  if (filter.employeeId) query = query.eq('occupied_by', filter.employeeId)
  if (filter.minDuration) query = query.gte('duration_minutes', filter.minDuration)
  if (filter.limit)    query = query.limit(filter.limit)
  if (filter.offset != null && filter.limit)
    query = query.range(filter.offset, filter.offset + filter.limit - 1)

  const { data, error } = await query
  if (error) throw error
  return (data as CompletedSession[]) ?? []
}

export interface PaginatedCompletedSessions {
  sessions: CompletedSession[]
  total: number
}

export async function getCompletedSessionsPage(
  filter: SessionsFilter = {}
): Promise<PaginatedCompletedSessions> {
  const supabase = await createClient()
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0
  let query = supabase
    .from('v_completed_sessions')
    .select('*', { count: 'exact' })

  if (filter.zoneCode) query = query.eq('zone_code', filter.zoneCode)
  if (filter.from) query = query.gte('occupied_at', filter.from)
  if (filter.to) query = query.lte('occupied_at', filter.to)
  if (filter.employeeId) query = query.eq('occupied_by', filter.employeeId)
  if (filter.minDuration) query = query.gte('duration_minutes', filter.minDuration)

  query = filter.sort === 'longest'
    ? query.order('duration_minutes', { ascending: false })
    : query.order('occupied_at', { ascending: false })

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) throw error

  return {
    sessions: (data as CompletedSession[]) ?? [],
    total: count ?? 0,
  }
}

export interface CompletedSessionsStats {
  total_sessions: number
  total_duration_minutes: number
  average_duration_minutes: number
  top_zone_code: string | null
  top_zone_sessions: number
}

export async function getCompletedSessionsStats(
  filter: SessionsFilter = {}
): Promise<CompletedSessionsStats> {
  const supabase = await createClient()
  let query = supabase
    .from('v_completed_sessions')
    .select('zone_code, duration_minutes')

  if (filter.zoneCode) query = query.eq('zone_code', filter.zoneCode)
  if (filter.from) query = query.gte('occupied_at', filter.from)
  if (filter.to) query = query.lte('occupied_at', filter.to)
  if (filter.employeeId) query = query.eq('occupied_by', filter.employeeId)
  if (filter.minDuration) query = query.gte('duration_minutes', filter.minDuration)

  const { data, error } = await query
  if (error) throw error

  const rows = ((data ?? []) as { zone_code: string; duration_minutes: number | null }[])
  const totalDuration = rows.reduce(
    (sum, row) => sum + Number(row.duration_minutes ?? 0),
    0,
  )
  const zoneCounts: Record<string, number> = {}
  rows.forEach((row) => {
    zoneCounts[row.zone_code] = (zoneCounts[row.zone_code] ?? 0) + 1
  })

  const topZone = Object.entries(zoneCounts).reduce<{ code: string | null; count: number }>(
    (best, [code, count]) => (count > best.count ? { code, count } : best),
    { code: null, count: 0 },
  )

  return {
    total_sessions: rows.length,
    total_duration_minutes: totalDuration,
    average_duration_minutes: rows.length ? Math.round(totalDuration / rows.length) : 0,
    top_zone_code: topZone.code,
    top_zone_sessions: topZone.count,
  }
}

export async function getHourlyArrivals(
  from: string,
  to: string,
  zoneCode?: string
): Promise<{ hour: number; count: number }[]> {
  const supabase = await createClient()
  let query = supabase
    .from('v_completed_sessions')
    .select('arrival_hour')
    .gte('occupied_at', from)
    .lte('occupied_at', to)

  if (zoneCode) query = query.eq('zone_code', zoneCode)

  const { data, error } = await query
  if (error) throw error

  const counts: Record<number, number> = {}
  for (let h = 0; h < 24; h++) counts[h] = 0
  ;(data ?? []).forEach((row: any) => {
    counts[row.arrival_hour] = (counts[row.arrival_hour] ?? 0) + 1
  })

  return Object.entries(counts).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }))
}

export async function getHourlyDepartures(
  from: string,
  to: string,
  zoneCode?: string
): Promise<{ hour: number; count: number }[]> {
  const supabase = await createClient()
  let query = supabase
    .from('v_completed_sessions')
    .select('departure_hour')
    .gte('occupied_at', from)
    .lte('occupied_at', to)

  if (zoneCode) query = query.eq('zone_code', zoneCode)

  const { data, error } = await query
  if (error) throw error

  const counts: Record<number, number> = {}
  for (let h = 0; h < 24; h++) counts[h] = 0
  ;(data ?? []).forEach((row: any) => {
    counts[row.departure_hour] = (counts[row.departure_hour] ?? 0) + 1
  })

  return Object.entries(counts).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }))
}

export async function getAverageDurationByZone(
  from: string,
  to: string
): Promise<{ zone_code: string; avg_minutes: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_completed_sessions')
    .select('zone_code, duration_minutes')
    .gte('occupied_at', from)
    .lte('occupied_at', to)

  if (error) throw error

  const byZone: Record<string, number[]> = {}
  ;(data ?? []).forEach((row: any) => {
    if (!byZone[row.zone_code]) byZone[row.zone_code] = []
    byZone[row.zone_code].push(row.duration_minutes)
  })

  return Object.entries(byZone).map(([zone_code, vals]) => ({
    zone_code,
    avg_minutes: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  }))
}

export async function getTotalOccupiedMinutesByZone(
  from: string,
  to: string
): Promise<Record<string, number>> {
  const supabase = await createClient()
  const [{ data: completed, error: completedError }, { data: active, error: activeError }] =
    await Promise.all([
      supabase
        .from('v_completed_sessions')
        .select('zone_code, duration_minutes')
        .gte('occupied_at', from)
        .lte('occupied_at', to),
      supabase
        .from('v_active_sessions')
        .select('zone_code, minutes_so_far'),
    ])

  if (completedError) throw completedError
  if (activeError) throw activeError

  const totals: Record<string, number> = {}
  ;(completed ?? []).forEach((row: any) => {
    totals[row.zone_code] = (totals[row.zone_code] ?? 0) + Number(row.duration_minutes ?? 0)
  })
  ;(active ?? []).forEach((row: any) => {
    totals[row.zone_code] = (totals[row.zone_code] ?? 0) + Number(row.minutes_so_far ?? 0)
  })

  return totals
}

export interface DashboardInsights {
  active_sessions: number
  completed_sessions: number
  average_duration_minutes: number
}

export async function getDashboardInsights(
  from: string,
  to: string,
  zoneCode?: string
): Promise<DashboardInsights> {
  const supabase = await createClient()

  let completedQuery = supabase
    .from('v_completed_sessions')
    .select('duration_minutes')
    .gte('occupied_at', from)
    .lte('occupied_at', to)

  let activeQuery = supabase
    .from('v_active_sessions')
    .select('id')

  if (zoneCode) {
    completedQuery = completedQuery.eq('zone_code', zoneCode)
    activeQuery = activeQuery.eq('zone_code', zoneCode)
  }

  const [{ data: completed, error: completedError }, { data: active, error: activeError }] =
    await Promise.all([completedQuery, activeQuery])

  if (completedError) throw completedError
  if (activeError) throw activeError

  const durations = ((completed ?? []) as { duration_minutes: number | null }[])
    .map((row) => Number(row.duration_minutes ?? 0))
    .filter((minutes) => Number.isFinite(minutes) && minutes > 0)

  return {
    active_sessions: (active ?? []).length,
    completed_sessions: (completed ?? []).length,
    average_duration_minutes: durations.length
      ? Math.round(durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length)
      : 0,
  }
}

// ============================================================
// ADMIN: RECENT EVENTS
// ============================================================

export interface SpotEventWithDetails extends SpotEvent {
  spot_code: string
  zone_code: string
  performer_name: string
}

export interface SpotEventsFilter {
  zoneCode?: string
  eventType?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface PaginatedSpotEvents {
  events: SpotEventWithDetails[]
  total: number
}

export async function getRecentEvents(
  filter: SpotEventsFilter = {}
): Promise<PaginatedSpotEvents> {
  const supabase = await createClient()
  const limit = filter.limit ?? 20
  const offset = filter.offset ?? 0

  let query = supabase
    .from('spot_events')
    .select(`
      *,
      parking_spots!inner(spot_code, zones!inner(code)),
      profiles!performed_by(full_name)
    `, { count: 'exact' })
    .order('performed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter.eventType) query = query.eq('event_type', filter.eventType)
  if (filter.from) query = query.gte('performed_at', filter.from)
  if (filter.to) query = query.lte('performed_at', filter.to)
  if (filter.zoneCode) query = query.eq('parking_spots.zones.code', filter.zoneCode)

  const { data, error, count } = await query

  if (error) throw error

  return {
    events: ((data ?? []) as any[]).map((row) => ({
      ...row,
      spot_code: row.parking_spots?.spot_code ?? '',
      zone_code: row.parking_spots?.zones?.code ?? '',
      performer_name: row.profiles?.full_name ?? '',
    })),
    total: count ?? 0,
  }
}

// ============================================================
// ADMIN: USERS
// ============================================================

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Profile[]) ?? []
}
