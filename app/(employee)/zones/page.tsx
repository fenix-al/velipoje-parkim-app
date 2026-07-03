import { Metadata } from 'next'
import Link from 'next/link'
import { getActiveZones, getCurrentOccupancy } from '@/lib/db/queries'
import { MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import EmptyState from '@/components/shared/EmptyState'
import OccupancyBar from '@/components/shared/OccupancyBar'
import { occupancyColor } from '@/lib/design/status'

export const metadata: Metadata = {
  title: 'Zonat — Parkimi Velipojë',
}

export default async function ZonesPage() {
  const [zones, occupancy] = await Promise.all([
    getActiveZones(),
    getCurrentOccupancy(),
  ])

  const occupancyMap = Object.fromEntries(
    occupancy.map((o) => [o.zone_code, o])
  )

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-2 py-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-gray-900">Zgjidhni zonën</h1>
      </div>

      {zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nuk ka zona aktive"
          description="Asnjë zonë parkimi nuk është aktive për momentin. Kontakto administratorin."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {zones.map((zone) => {
            const occ = occupancyMap[zone.code]
            const pct = occ ? Number(occ.occupancy_percentage) : 0
            return (
              <Link key={zone.id} href={`/zones/${zone.code}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{zone.name}</p>
                        <p className="text-sm text-muted-foreground">{zone.code}</p>
                        {occ && (
                          <div className="mt-2 flex gap-3 text-xs">
                            <span className="font-medium text-red-600">{occ.occupied_count} zënë</span>
                            <span className="font-medium text-green-600">{occ.free_count} lirë</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {occ && (
                          <div className="text-right">
                            <div
                              className="text-lg font-bold"
                              style={{ color: occupancyColor(pct) }}
                            >
                              {pct}%
                            </div>
                            <div className="text-xs text-muted-foreground">zënia</div>
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    {occ && <OccupancyBar pct={pct} className="mt-3" />}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
