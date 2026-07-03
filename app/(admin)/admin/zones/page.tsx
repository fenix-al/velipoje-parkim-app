import { Metadata } from 'next'
import { getAllZones } from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import ZonesManager from '@/components/admin/ZonesManager'

export const metadata: Metadata = {
  title: 'Zonat — Admin Parkimi',
}

export default async function AdminZonesPage() {
  const [zones, profile] = await Promise.all([getAllZones(), getProfile()])

  return <ZonesManager zones={zones} canManage={profile?.role === 'admin'} />
}
