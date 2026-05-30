'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') throw new Error('Unauthorized')
  return profile
}

export async function createZone(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const code = (formData.get('code') as string)?.trim().toUpperCase()
  const address = (formData.get('address') as string)?.trim() || null
  const latRaw = formData.get('latitude') as string
  const lngRaw = formData.get('longitude') as string
  const latitude = latRaw ? parseFloat(latRaw) : null
  const longitude = lngRaw ? parseFloat(lngRaw) : null

  if (!name) return { error: 'Emri i zonës është i detyrueshëm.' }
  if (!code) return { error: 'Kodi i zonës është i detyrueshëm.' }

  // map_* columns are NOT NULL with defaults in the schema; the grid view does
  // not use them, so we pass a placeholder image path.
  const { error } = await supabase.from('zones').insert({
    code,
    name,
    address,
    latitude,
    longitude,
    map_image_path: '/maps/default.jpg',
    is_active: true,
  } as any)

  if (error) return { error: error.message }

  revalidatePath('/admin/zones')
  revalidatePath('/zones')
  return { success: true }
}

export async function updateZoneDetails(zoneId: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const code = (formData.get('code') as string)?.trim().toUpperCase()
  const address = (formData.get('address') as string)?.trim() || null
  const latRaw = formData.get('latitude') as string
  const lngRaw = formData.get('longitude') as string
  const latitude = latRaw ? parseFloat(latRaw) : null
  const longitude = lngRaw ? parseFloat(lngRaw) : null

  if (!name) return { error: 'Emri i zonës është i detyrueshëm.' }
  if (!code) return { error: 'Kodi i zonës është i detyrueshëm.' }

  const { error } = await supabase
    .from('zones')
    .update({ name, code, address, latitude, longitude } as any)
    .eq('id', zoneId)

  if (error) return { error: error.message }

  revalidatePath('/admin/zones')
  revalidatePath('/zones')
  return { success: true }
}

export async function deleteZone(zoneId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: spots } = await supabase
    .from('parking_spots')
    .select('id')
    .eq('zone_id', zoneId)

  if (spots && spots.length > 0) {
    const spotIds = spots.map((s) => s.id)
    const { data: active } = await supabase
      .from('parking_sessions')
      .select('id')
      .in('spot_id', spotIds)
      .is('released_at', null)
      .limit(1)

    if (active && active.length > 0) {
      return { error: 'Nuk mund të fshini një zonë me sesione aktive parkimi.' }
    }
  }

  const { error } = await supabase.from('zones').delete().eq('id', zoneId)
  if (error) return { error: error.message }

  revalidatePath('/admin/zones')
  revalidatePath('/zones')
  return { success: true }
}

export async function toggleZoneActive(zoneId: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('zones')
    .update({ is_active: isActive } as any)
    .eq('id', zoneId)

  if (error) return { error: error.message }

  revalidatePath('/admin/zones')
  revalidatePath('/zones')
  return { success: true }
}

export async function setZoneEntry(
  zoneId: string,
  position: 'top' | 'bottom' | 'none'
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('zones')
    .update({ entry_position: position } as any)
    .eq('id', zoneId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/zones/${zoneId}/layout`)
  revalidatePath('/zones')
  return { success: true }
}

// ============================================================
// GRID LAYOUT: rows ("rreshta") + spots
// ============================================================

function revalidateLayout(zoneId: string) {
  revalidatePath(`/admin/zones/${zoneId}/layout`)
  revalidatePath('/zones')
}

/** Next free "V{n}" code for a zone, avoiding collisions with existing codes. */
async function nextSpotCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  zoneId: string
): Promise<string> {
  const { data } = await supabase
    .from('parking_spots')
    .select('spot_code')
    .eq('zone_id', zoneId)

  const used = new Set((data ?? []).map((s: any) => s.spot_code as string))
  let n = used.size + 1
  let code = `V${String(n).padStart(2, '0')}`
  while (used.has(code)) {
    n++
    code = `V${String(n).padStart(2, '0')}`
  }
  return code
}

export async function createRow(zoneId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('zone_rows')
    .select('position')
    .eq('zone_id', zoneId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPos = rows && rows.length > 0 ? (rows[0].position as number) + 1 : 0

  const { error } = await supabase
    .from('zone_rows')
    .insert({ zone_id: zoneId, position: nextPos, label: null } as any)

  if (error) return { error: error.message }

  revalidateLayout(zoneId)
  return { success: true }
}

export async function renameRow(rowId: string, zoneId: string, label: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('zone_rows')
    .update({ label: label.trim() || null } as any)
    .eq('id', rowId)

  if (error) return { error: error.message }

  revalidateLayout(zoneId)
  return { success: true }
}

export async function deleteRow(rowId: string, zoneId: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Block deletion if any spot in the row has an active session.
  const { data: spots } = await supabase
    .from('parking_spots')
    .select('id')
    .eq('row_id', rowId)

  if (spots && spots.length > 0) {
    const spotIds = spots.map((s) => s.id)
    const { data: active } = await supabase
      .from('parking_sessions')
      .select('id')
      .in('spot_id', spotIds)
      .is('released_at', null)
      .limit(1)

    if (active && active.length > 0) {
      return { error: 'Nuk mund të fshini një rresht me vende të zëna.' }
    }
  }

  const { error } = await supabase.from('zone_rows').delete().eq('id', rowId)
  if (error) return { error: error.message }

  revalidateLayout(zoneId)
  return { success: true }
}

export async function addSpotToRow(zoneId: string, rowId: string, code?: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('parking_spots')
    .select('position')
    .eq('row_id', rowId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPos = existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0
  const spot_code = code?.trim() || await nextSpotCode(supabase, zoneId)

  const { error } = await supabase.from('parking_spots').insert({
    zone_id: zoneId,
    row_id: rowId,
    spot_code,
    position: nextPos,
    polygon: null,
    current_status: 'free',
    is_active: true,
  } as any)

  if (error) {
    if (error.code === '23505') return { error: 'Ky emër/kod ekziston tashmë në këtë zonë.' }
    return { error: error.message }
  }

  revalidateLayout(zoneId)
  return { success: true }
}

export async function renameSpot(spotId: string, zoneId: string, code: string) {
  await requireAdmin()
  const supabase = await createClient()

  const trimmed = code.trim()
  if (!trimmed) return { error: 'Kodi i vendit nuk mund të jetë bosh.' }

  const { error } = await supabase
    .from('parking_spots')
    .update({ spot_code: trimmed } as any)
    .eq('id', spotId)

  if (error) {
    if (error.code === '23505') return { error: 'Ky kod ekziston tashmë në këtë zonë.' }
    return { error: error.message }
  }

  revalidateLayout(zoneId)
  return { success: true }
}

export async function deleteSpot(spotId: string, zoneId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: active } = await supabase
    .from('parking_sessions')
    .select('id')
    .eq('spot_id', spotId)
    .is('released_at', null)
    .limit(1)

  if (active && active.length > 0) {
    return { error: 'Nuk mund të fshini një vend të zënë.' }
  }

  const { error } = await supabase.from('parking_spots').delete().eq('id', spotId)
  if (error) return { error: error.message }

  revalidateLayout(zoneId)
  return { success: true }
}
