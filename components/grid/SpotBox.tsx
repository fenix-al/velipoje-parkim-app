'use client'

import { Loader2 } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/design/status'
import type { ParkingSpot } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  spot: ParkingSpot
  isPending?: boolean
  isSelected?: boolean
  onClick?: (spot: ParkingSpot) => void
}

/**
 * Kuti e thjeshtë vendi për pamjen desktop — kodi lart dhe pika e statusit poshtë.
 */
export default function SpotBox({ spot, isPending, isSelected, onClick }: Props) {
  const status = spot.current_status
  const occupied = status === 'occupied'
  const outOfService = status === 'out_of_service'
  const dotColor = outOfService
    ? STATUS_COLORS.out_of_service
    : occupied
      ? STATUS_COLORS.occupied
      : STATUS_COLORS.free

  return (
    <button
      type="button"
      onClick={() => onClick?.(spot)}
      disabled={!onClick}
      aria-label={`Vend ${spot.spot_code} — ${
        occupied ? 'i zënë' : outOfService ? 'jashtë shërbimit' : 'i lirë'
      }`}
      aria-pressed={isSelected}
      className={cn(
        'relative flex h-[68px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border text-sm font-bold transition-all',
        onClick && 'cursor-pointer hover:shadow-sm active:scale-[0.97]',
        outOfService
          ? 'border-gray-200 bg-gray-100 text-gray-400'
          : occupied
            ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
            : 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:border-emerald-400',
        isSelected && 'border-primary ring-2 ring-primary/40',
      )}
    >
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        </div>
      )}
      <span>{spot.spot_code}</span>
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />
    </button>
  )
}
