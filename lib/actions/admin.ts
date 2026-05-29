'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AppRole } from '@/lib/supabase/types'

async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return profile
}

export async function updateUserRole(userId: string, role: AppRole) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role } as any)
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive } as any)
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateZone(
  zoneId: string,
  data: { name?: string; map_width?: number; map_height?: number; is_active?: boolean }
) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('zones')
    .update(data as any)
    .eq('id', zoneId)

  if (error) return { error: error.message }
  revalidatePath('/admin/zones')
  return { success: true }
}

export async function upsertParkingSpot(spot: {
  id?: string
  zone_id: string
  spot_code: string
  polygon: [number, number][]
}) {
  await requireAdmin()
  const supabase = await createClient()

  if (spot.id) {
    const { error } = await supabase
      .from('parking_spots')
      .update({ spot_code: spot.spot_code, polygon: spot.polygon } as any)
      .eq('id', spot.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('parking_spots')
      .insert({ zone_id: spot.zone_id, spot_code: spot.spot_code, polygon: spot.polygon } as any)
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/map-editor')
  return { success: true }
}

export async function deleteParkingSpot(spotId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('parking_spots')
    .update({ is_active: false } as any)
    .eq('id', spotId)

  if (error) return { error: error.message }
  revalidatePath('/admin/map-editor')
  return { success: true }
}
