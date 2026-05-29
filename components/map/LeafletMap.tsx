'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { ParkingSpot, SpotStatus } from '@/lib/supabase/types'
import { polygonDbToLeaflet } from '@/lib/utils/coords'

interface Props {
  imageUrl: string
  mapWidth: number
  mapHeight: number
  spots: ParkingSpot[]
  pendingSpotId: string | null
  onSpotClick: (spot: ParkingSpot) => void
}

const STATUS_COLORS: Record<SpotStatus, string> = {
  free:            '#22c55e',
  occupied:        '#ef4444',
  out_of_service:  '#6b7280',
}
const PENDING_COLOR = '#eab308'

export default function LeafletMapComponent({
  imageUrl,
  mapWidth,
  mapHeight,
  spots,
  pendingSpotId,
  onSpotClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const polygonsRef = useRef<Map<string, L.Polygon>>(new Map())
  const [ready, setReady] = useState(false)

  // Initialise Leaflet once (client-only)
  useEffect(() => {
    let L: typeof import('leaflet')

    async function init() {
      L = (await import('leaflet')).default

      if (!containerRef.current || mapRef.current) return

      const bounds: L.LatLngBoundsExpression = [[0, 0], [mapHeight, mapWidth]]

      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 2,
        zoomSnap: 0.25,
        attributionControl: false,
      })

      L.imageOverlay(imageUrl, bounds).addTo(map)
      map.fitBounds(bounds, { padding: [8, 8] })
      mapRef.current = map
      setReady(true)
    }

    init()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Draw / update polygons when spots or pending state changes
  useEffect(() => {
    if (!ready || !mapRef.current) return

    async function drawPolygons() {
      const L = (await import('leaflet')).default
      const map = mapRef.current!

      // Remove stale polygons
      polygonsRef.current.forEach((poly, id) => {
        if (!spots.find((s) => s.id === id)) {
          poly.remove()
          polygonsRef.current.delete(id)
        }
      })

      spots.forEach((spot) => {
        const leafletCoords = polygonDbToLeaflet(spot.polygon)
        const isPending = spot.id === pendingSpotId
        const color = isPending ? PENDING_COLOR : STATUS_COLORS[spot.current_status]

        const existing = polygonsRef.current.get(spot.id)

        if (existing) {
          existing.setLatLngs(leafletCoords as L.LatLngExpression[])
          existing.setStyle({
            fillColor: color,
            color,
            fillOpacity: isPending ? 0.5 : 0.65,
          })
        } else {
          const poly = L.polygon(leafletCoords as L.LatLngExpression[], {
            fillColor: color,
            color,
            weight: 2,
            fillOpacity: isPending ? 0.5 : 0.65,
            className: 'spot-polygon',
          })

          poly.on('click', () => {
            if (!isPending) onSpotClick(spot)
          })

          // Tooltip with spot code
          poly.bindTooltip(spot.spot_code, {
            permanent: false,
            direction: 'center',
            className: 'spot-tooltip',
          })

          poly.addTo(map)
          polygonsRef.current.set(spot.id, poly)
        }
      })
    }

    drawPolygons()
  }, [ready, spots, pendingSpotId, onSpotClick])

  // Update click handler when spots change (closure refresh)
  useEffect(() => {
    if (!ready) return
    polygonsRef.current.forEach((poly, id) => {
      const spot = spots.find((s) => s.id === id)
      if (!spot) return
      const isPending = id === pendingSpotId
      poly.off('click')
      poly.on('click', () => {
        if (!isPending) onSpotClick(spot)
      })
    })
  }, [ready, spots, pendingSpotId, onSpotClick])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      data-testid="leaflet-map"
    />
  )
}
