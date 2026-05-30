import { Metadata } from 'next'
import { getAllZones } from '@/lib/db/queries'
import ZonesManager from '@/components/admin/ZonesManager'

export const metadata: Metadata = {
  title: 'Zonat — Admin Parkimi',
}

export default async function AdminZonesPage() {
  const zones = await getAllZones()

  return <ZonesManager zones={zones} />
}
