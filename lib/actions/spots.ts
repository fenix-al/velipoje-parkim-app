'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/server'
import type { RpcResult } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

async function callSpotRpc(
  fn: 'occupy_spot' | 'release_spot' | 'set_spot_out_of_service' | 'restore_spot',
  spotId: string,
  zoneCode: string
): Promise<RpcResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(fn as any, { p_spot_id: spotId })

  if (error) {
    return { success: false, error: error.message }
  }

  const result = data as RpcResult
  if (result.success) {
    revalidatePath(`/zones/${zoneCode}`)
  }
  return result
}

export async function occupySpot(spotId: string, zoneCode: string): Promise<RpcResult> {
  return callSpotRpc('occupy_spot', spotId, zoneCode)
}

export async function releaseSpot(spotId: string, zoneCode: string): Promise<RpcResult> {
  return callSpotRpc('release_spot', spotId, zoneCode)
}

export async function setSpotOutOfService(spotId: string, zoneCode: string): Promise<RpcResult> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Vetëm admini mund ta nxjerrë vendin jashtë përdorimi.' }
  }

  const supabase = await createClient()
  const { data: spot, error } = await supabase
    .from('parking_spots')
    .select('current_status')
    .eq('id', spotId)
    .single()

  if (error) return { success: false, error: error.message }
  if (spot?.current_status !== 'free') {
    return { success: false, error: 'Vendi duhet të jetë i lirë para se të nxirret jashtë përdorimi.' }
  }

  return callSpotRpc('set_spot_out_of_service', spotId, zoneCode)
}

export async function restoreSpot(spotId: string, zoneCode: string): Promise<RpcResult> {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Vetëm admini mund ta rikthejë vendin në përdorim.' }
  }

  return callSpotRpc('restore_spot', spotId, zoneCode)
}
