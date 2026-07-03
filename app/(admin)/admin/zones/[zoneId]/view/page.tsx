import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getActiveSessionsByZone,
  getActiveZones,
  getZoneById,
  getZoneLayout,
} from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import ZoneGridView from '@/components/grid/ZoneGridView'

interface Props {
  params: Promise<{ zoneId: string }>
}

export const metadata: Metadata = {
  title: 'Pamja e zonës — Admin Parkimi',
}

/** Pamja live e zonës brenda panelit admin — nuk del te pamja e punonjësit. */
export default async function AdminZoneViewPage({ params }: Props) {
  const { zoneId } = await params
  const [zone, profile] = await Promise.all([getZoneById(zoneId), getProfile()])

  if (!zone || !profile) notFound()

  const [rows, activeSessions, allZones] = await Promise.all([
    getZoneLayout(zone.id),
    getActiveSessionsByZone(zone.id),
    getActiveZones(),
  ])

  const zoneSwitcher = allZones.map((z) => ({
    code: z.code,
    href: `/admin/zones/${z.id}/view`,
    current: z.id === zone.id,
  }))

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <ZoneGridView
        zone={zone}
        initialRows={rows}
        initialActiveSessions={activeSessions}
        userRole={profile.role}
        backHref="/admin/zones"
        zoneSwitcher={zoneSwitcher}
      />
    </div>
  )
}
