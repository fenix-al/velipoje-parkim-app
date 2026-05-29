import { Metadata } from 'next'
import { getAllZones, getSpotsByZone } from '@/lib/db/queries'
import MapEditorClient from '@/components/admin/MapEditorClient'

export const metadata: Metadata = {
  title: 'Editori i Hartës — Admin Parkimi',
}

interface Props {
  searchParams: Promise<{ zone?: string }>
}

export default async function MapEditorPage({ searchParams }: Props) {
  const params    = await searchParams
  const zoneCode  = params.zone ?? 'Z1'
  const zones     = await getAllZones()
  const activeZone = zones.find((z) => z.code === zoneCode) ?? zones[0]
  const spots      = activeZone ? await getSpotsByZone(activeZone.id) : []

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h1 className="text-xl font-bold text-gray-900 flex-shrink-0">Editori i hartës</h1>
      <MapEditorClient
        zones={zones}
        activeZone={activeZone ?? null}
        initialSpots={spots}
      />
    </div>
  )
}
