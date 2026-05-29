import { Metadata } from 'next'
import Link from 'next/link'
import { getActiveZones } from '@/lib/db/queries'
import { getCurrentOccupancy } from '@/lib/db/queries'
import { MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 py-2">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h1 className="text-lg font-semibold text-gray-900">Zgjidhni zonën</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {zones.map((zone) => {
          const occ = occupancyMap[zone.code]
          const pct = occ ? Number(occ.occupancy_percentage) : 0
          return (
            <Link key={zone.id} href={`/zones/${zone.code}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">{zone.code}</p>
                      {occ && (
                        <div className="mt-2 flex gap-3 text-xs">
                          <span className="text-red-600 font-medium">{occ.occupied_count} zënë</span>
                          <span className="text-green-600 font-medium">{occ.free_count} lirë</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {occ && (
                        <div className="text-right">
                          <div
                            className="text-lg font-bold"
                            style={{ color: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e' }}
                          >
                            {pct}%
                          </div>
                          <div className="text-xs text-muted-foreground">zënia</div>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  {occ && (
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
