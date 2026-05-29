import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getZoneByCode, getSpotsByZone } from '@/lib/db/queries'
import { getProfile } from '@/lib/supabase/server'
import ZoneMap from '@/components/map/ZoneMap'

interface Props {
  params: Promise<{ zoneCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zoneCode } = await params
  return { title: `${zoneCode} — Parkimi Velipojë` }
}

export default async function ZoneMapPage({ params }: Props) {
  const { zoneCode } = await params
  const [zone, profile] = await Promise.all([
    getZoneByCode(zoneCode.toUpperCase()),
    getProfile(),
  ])

  if (!zone) notFound()
  if (!profile) notFound()

  const spots = await getSpotsByZone(zone.id)

  return (
    <div className="map-container relative h-full">
      <ZoneMap
        zone={zone}
        initialSpots={spots}
        userRole={profile.role}
      />
    </div>
  )
}
