import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getZoneById, getZoneLayout } from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import ZoneLayoutEditor from '@/components/admin/ZoneLayoutEditor'

interface Props {
  params: Promise<{ zoneId: string }>
}

export const metadata: Metadata = {
  title: 'Layout i zonës — Admin Parkimi',
}

export default async function ZoneLayoutPage({ params }: Props) {
  const { zoneId } = await params
  const profile = await getProfile()
  // Vetëm admini ndryshon strukturën e vendeve (RLS e bllokon gjithsesi).
  if (profile?.role !== 'admin') redirect('/admin/zones')

  const zone = await getZoneById(zoneId)
  if (!zone) notFound()

  const rows = await getZoneLayout(zone.id)

  return <ZoneLayoutEditor zone={zone} initialRows={rows} />
}
