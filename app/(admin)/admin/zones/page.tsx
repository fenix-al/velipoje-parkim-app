import { Metadata } from 'next'
import { getAllZones } from '@/lib/db/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Zonat — Admin Parkimi',
}

export default async function AdminZonesPage() {
  const zones = await getAllZones()

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Zonat e parkimit</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{zone.name}</CardTitle>
                <Badge variant={zone.is_active ? 'success' : 'secondary'}>
                  {zone.is_active ? 'Aktive' : 'Joaktive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kodi</span>
                <span className="font-mono font-medium">{zone.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensionet</span>
                <span>{zone.map_width} × {zone.map_height} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harta</span>
                <span className="text-xs font-mono truncate max-w-[180px]">
                  {zone.map_image_path}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
