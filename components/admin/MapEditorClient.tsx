'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Zone, ParkingSpot } from '@/lib/supabase/types'

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false })

interface Props {
  zones: Zone[]
  activeZone: Zone | null
  initialSpots: ParkingSpot[]
}

export default function MapEditorClient({ zones, activeZone, initialSpots }: Props) {
  const router = useRouter()
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)

  function handleZoneChange(code: string) {
    router.push(`/admin/map-editor?zone=${code}`)
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Zone selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={activeZone?.code ?? ''} onValueChange={handleZoneChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Zgjidhni zonën" />
          </SelectTrigger>
          <SelectContent>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.code}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeZone && (
          <Badge variant="outline">{initialSpots.length} vende</Badge>
        )}
        <p className="text-sm text-muted-foreground">
          Klikoni mbi vendet e parkimit për detaje. Shtoni vende të reja nga database/migrations.
        </p>
      </div>

      {/* Map */}
      {activeZone ? (
        <div className="flex-1 min-h-[400px] rounded-lg overflow-hidden border">
          <LeafletMap
            imageUrl={activeZone.map_image_path}
            mapWidth={activeZone.map_width}
            mapHeight={activeZone.map_height}
            spots={initialSpots}
            pendingSpotId={null}
            onSpotClick={setSelectedSpot}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nuk ka zonë aktive.
          </CardContent>
        </Card>
      )}

      {/* Selected spot info */}
      {selectedSpot && (
        <Card>
          <CardContent className="p-4">
            <p className="font-medium">{selectedSpot.spot_code}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
              {JSON.stringify(selectedSpot.polygon)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
