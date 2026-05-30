'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function createUserByAdmin(formData: FormData) {
  await requireAdmin()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'employee') as AppRole

  if (!email) return { error: 'Email eshte i detyrueshem.' }
  if (!password || password.length < 6) {
    return { error: 'Password duhet te kete te pakten 6 karaktere.' }
  }
  if (!['admin', 'supervisor', 'employee'].includes(role)) {
    return { error: 'Roli nuk eshte i vlefshem.' }
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Konfigurimi i Supabase mungon.' }
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || email.split('@')[0],
      role,
    },
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'User-i nuk u krijua.' }

  const { error: passwordError } = await adminClient.auth.admin.updateUserById(data.user.id, {
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || email.split('@')[0],
      role,
    },
  })

  if (passwordError) return { error: passwordError.message }

  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: data.user.id,
      email,
      full_name: fullName || email.split('@')[0],
      role,
      is_active: true,
    } as any)

  if (profileError) return { error: profileError.message }

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

export async function updateUserPasswordByAdmin(userId: string, password: string) {
  await requireAdmin()

  if (!password || password.length < 6) {
    return { error: 'Password duhet te kete te pakten 6 karaktere.' }
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Konfigurimi i Supabase mungon.' }
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}
