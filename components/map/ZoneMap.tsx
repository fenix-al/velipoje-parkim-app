'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ParkingSpot, Zone } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { occupySpot, releaseSpot, setSpotOutOfService, restoreSpot } from '@/lib/actions/spots'
import SpotBottomSheet from './SpotBottomSheet'
import MapLegend from './MapLegend'
import OfflineBanner from './OfflineBanner'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-400 text-sm">Duke ngarkuar hartën…</div>
    </div>
  ),
})

interface Props {
  zone: Zone
  initialSpots: ParkingSpot[]
  userRole: 'admin' | 'supervisor' | 'employee'
}

export default function ZoneMap({ zone, initialSpots, userRole }: Props) {
  const [spots, setSpots]             = useState<ParkingSpot[]>(initialSpots)
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [pendingSpotId, setPendingSpotId] = useState<string | null>(null)
  const [isOnline, setIsOnline]       = useState(true)
  const supabase                      = useRef(createClient())

  // ── Online/offline detection ───────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // ── Supabase Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.current
      .channel(`zone-${zone.id}-spots`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_spots',
          filter: `zone_id=eq.${zone.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSpots((prev) =>
              prev.map((s) =>
                s.id === (payload.new as ParkingSpot).id
                  ? { ...s, ...(payload.new as ParkingSpot) }
                  : s
              )
            )
            // Also update selected spot if it changed
            setSelectedSpot((prev) =>
              prev?.id === (payload.new as ParkingSpot).id
                ? { ...prev, ...(payload.new as ParkingSpot) }
                : prev
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.current.removeChannel(channel)
    }
  }, [zone.id])

  // ── Spot click ─────────────────────────────────────────────────────────────
  const handleSpotClick = useCallback((spot: ParkingSpot) => {
    setSelectedSpot(spot)
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleOccupy(spot: ParkingSpot) {
    if (!isOnline) {
      toast.error('Nuk ka lidhje interneti. Provo më vonë.')
      return
    }
    setPendingSpotId(spot.id)
    try {
      const result = await occupySpot(spot.id, zone.code)
      if (result.success) {
        toast.success(`Vendi ${spot.spot_code} u zë.`)
        setSelectedSpot(null)
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingSpotId(null)
    }
  }

  async function handleRelease(spot: ParkingSpot) {
    if (!isOnline) {
      toast.error('Nuk ka lidhje interneti. Provo më vonë.')
      return
    }
    setPendingSpotId(spot.id)
    try {
      const result = await releaseSpot(spot.id, zone.code)
      if (result.success) {
        toast.success(`Vendi ${spot.spot_code} u lirua.`)
        setSelectedSpot(null)
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingSpotId(null)
    }
  }

  async function handleOutOfService(spot: ParkingSpot) {
    if (!isOnline) return
    setPendingSpotId(spot.id)
    try {
      const result = await setSpotOutOfService(spot.id, zone.code)
      if (result.success) {
        toast.success(`Vendi ${spot.spot_code} u vendos jashtë shërbimit.`)
        setSelectedSpot(null)
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingSpotId(null)
    }
  }

  async function handleRestore(spot: ParkingSpot) {
    if (!isOnline) return
    setPendingSpotId(spot.id)
    try {
      const result = await restoreSpot(spot.id, zone.code)
      if (result.success) {
        toast.success(`Vendi ${spot.spot_code} u rikthye.`)
        setSelectedSpot(null)
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingSpotId(null)
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Offline banner */}
      {!isOnline && <OfflineBanner />}

      {/* Map */}
      <div className="flex-1 min-h-0">
        <LeafletMap
          imageUrl={zone.map_image_path}
          mapWidth={zone.map_width}
          mapHeight={zone.map_height}
          spots={spots}
          pendingSpotId={pendingSpotId}
          onSpotClick={handleSpotClick}
        />
      </div>

      {/* Legend */}
      <MapLegend />

      {/* Bottom sheet */}
      {selectedSpot && (
        <SpotBottomSheet
          spot={selectedSpot}
          userRole={userRole}
          isOnline={isOnline}
          isPending={pendingSpotId === selectedSpot.id}
          onOccupy={handleOccupy}
          onRelease={handleRelease}
          onOutOfService={handleOutOfService}
          onRestore={handleRestore}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  )
}
