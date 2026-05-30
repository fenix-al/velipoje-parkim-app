import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActiveSessionsByZone, getZoneByCode, getZoneLayout } from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import ZoneGridView from '@/components/grid/ZoneGridView'

interface Props {
  params: Promise<{ zoneCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zoneCode } = await params
  return { title: `${zoneCode} — Parkimi Velipojë` }
}

export default async function ZonePage({ params }: Props) {
  const { zoneCode } = await params
  const [zone, profile] = await Promise.all([
    getZoneByCode(zoneCode.toUpperCase()),
    getProfile(),
  ])

  if (!zone) notFound()
  if (!profile) notFound()

  const [rows, activeSessions] = await Promise.all([
    getZoneLayout(zone.id),
    getActiveSessionsByZone(zone.id),
  ])

  return (
    <div className="h-full">
      <ZoneGridView
        zone={zone}
        initialRows={rows}
        initialActiveSessions={activeSessions}
        userRole={profile.role}
      />
    </div>
  )
}
