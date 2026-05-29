export type AppRole = 'admin' | 'supervisor' | 'employee'
export type SpotStatus = 'free' | 'occupied' | 'out_of_service'
export type SpotEventType =
  | 'occupied'
  | 'released'
  | 'out_of_service'
  | 'restored'
  | 'manual_correction'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: AppRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Zone {
  id: string
  code: 'Z1' | 'Z2' | 'Z3' | 'Z4'
  name: string
  map_image_path: string
  map_width: number
  map_height: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ParkingSpot {
  id: string
  zone_id: string
  spot_code: string
  polygon: [number, number][] // [[x,y],[x,y],...]
  current_status: SpotStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ParkingSession {
  id: string
  spot_id: string
  occupied_by: string
  occupied_at: string
  released_at: string | null
  released_by: string | null
  created_at: string
}

export interface SpotEvent {
  id: string
  spot_id: string
  session_id: string | null
  event_type: SpotEventType
  performed_by: string
  performed_at: string
  metadata: Record<string, unknown>
}

// ============================================================
// RPC response shapes
// ============================================================

export interface RpcSuccess {
  success: true
  spot_id: string
  spot_code: string
  session_id?: string
  occupied_at?: string
  released_at?: string
  duration_minutes?: number
}

export interface RpcFailure {
  success: false
  error: string
  current_status?: SpotStatus
}

export type RpcResult = RpcSuccess | RpcFailure

// ============================================================
// View types
// ============================================================

export interface OccupancyByZone {
  zone_id: string
  zone_code: string
  zone_name: string
  total_spots: number
  occupied_count: number
  free_count: number
  out_of_service_count: number
  occupancy_percentage: number
}

export interface CompletedSession {
  id: string
  spot_id: string
  spot_code: string
  zone_id: string
  zone_code: string
  zone_name: string
  occupied_by: string
  occupied_by_name: string
  occupied_at: string
  released_at: string
  released_by: string | null
  released_by_name: string | null
  duration_minutes: number
  arrival_hour: number
  departure_hour: number
}

export interface ActiveSession {
  id: string
  spot_id: string
  spot_code: string
  zone_id: string
  zone_code: string
  occupied_by: string
  occupied_by_name: string
  occupied_at: string
  minutes_so_far: number
}

// ============================================================
// Database type map (for Supabase client generics)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      zones: {
        Row: Zone
        Insert: Omit<Zone, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Zone, 'id' | 'created_at' | 'updated_at'>>
      }
      parking_spots: {
        Row: ParkingSpot
        Insert: Omit<ParkingSpot, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ParkingSpot, 'id' | 'created_at' | 'updated_at'>>
      }
      parking_sessions: {
        Row: ParkingSession
        Insert: Omit<ParkingSession, 'id' | 'created_at'>
        Update: Partial<Omit<ParkingSession, 'id' | 'created_at'>>
      }
      spot_events: {
        Row: SpotEvent
        Insert: Omit<SpotEvent, 'id'>
        Update: Partial<Omit<SpotEvent, 'id'>>
      }
    }
    Views: {
      v_current_occupancy_by_zone: { Row: OccupancyByZone }
      v_completed_sessions: { Row: CompletedSession }
      v_active_sessions: { Row: ActiveSession }
    }
    Functions: {
      occupy_spot: { Args: { p_spot_id: string }; Returns: RpcResult }
      release_spot: { Args: { p_spot_id: string }; Returns: RpcResult }
      set_spot_out_of_service: { Args: { p_spot_id: string }; Returns: RpcResult }
      restore_spot: { Args: { p_spot_id: string }; Returns: RpcResult }
    }
    Enums: {
      app_role: AppRole
      spot_status: SpotStatus
      spot_event_type: SpotEventType
    }
  }
}
