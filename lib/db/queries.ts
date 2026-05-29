import { createClient } from '@/lib/supabase/server'
import type {
  Zone,
  ParkingSpot,
  OccupancyByZone,
  CompletedSession,
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
  if (filter.limit)    query = query.limit(filter.limit)
  if (filter.offset != null && filter.limit)
    query = query.range(filter.offset, filter.offset + filter.limit - 1)

  const { data, error } = await query
  if (error) throw error
  return (data as CompletedSession[]) ?? []
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

// ============================================================
// ADMIN: RECENT EVENTS
// ============================================================

export interface SpotEventWithDetails extends SpotEvent {
  spot_code: string
  zone_code: string
  performer_name: string
}

export async function getRecentEvents(limit = 50): Promise<SpotEventWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('spot_events')
    .select(`
      *,
      parking_spots!inner(spot_code, zones!inner(code)),
      profiles!performed_by(full_name)
    `)
    .order('performed_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return ((data ?? []) as any[]).map((row) => ({
    ...row,
    spot_code: row.parking_spots?.spot_code ?? '',
    zone_code: row.parking_spots?.zones?.code ?? '',
    performer_name: row.profiles?.full_name ?? '',
  }))
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
