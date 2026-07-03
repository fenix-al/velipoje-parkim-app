'use client'

import { Loader2, Wrench } from 'lucide-react'
import type { ParkingSpot } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  spot: ParkingSpot
  isPending?: boolean
  onClick?: (spot: ParkingSpot) => void
}

/**
 * Kuti e thjeshtë vendi për pamjen desktop — vetëm kodi dhe ngjyra e statusit.
 */
export default function SpotBox({ spot, isPending, onClick }: Props) {
  const status = spot.current_status
  const occupied = status === 'occupied'
  const outOfService = status === 'out_of_service'

  return (
    <button
      type="button"
      onClick={() => onClick?.(spot)}
      disabled={!onClick}
      aria-label={`Vend ${spot.spot_code} — ${
        occupied ? 'i zënë' : outOfService ? 'jashtë shërbimit' : 'i lirë'
      }`}
      className={cn(
        'relative flex h-16 w-full items-center justify-center overflow-hidden rounded-lg border text-sm font-bold transition-all',
        onClick && 'cursor-pointer hover:shadow-sm active:scale-[0.97]',
        outOfService
          ? 'border-gray-200 bg-gray-100 text-gray-400'
          : occupied
            ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
      )}
    >
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        </div>
      )}
      {outOfService ? (
        <span className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5" />
          {spot.spot_code}
        </span>
      ) : (
        spot.spot_code
      )}
    </button>
  )
}
