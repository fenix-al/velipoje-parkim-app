'use client'

import { Loader2, Wrench } from 'lucide-react'
import type { ParkingSpot } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

/**
 * Top-down car icon (car.png), rotated 90° so it lies horizontally inside the
 * wide, short stall cells. The source image is a square portrait car.
 */
export function CarTopView({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/car.png"
      alt=""
      aria-hidden="true"
      className={cn('-rotate-90 object-contain select-none', className)}
      draggable={false}
    />
  )
}

interface Props {
  spot: ParkingSpot
  isPending?: boolean
  onClick?: (spot: ParkingSpot) => void
  /** Compact rendering for the admin editor. */
  compact?: boolean
}

export default function ParkingStall({ spot, isPending, onClick, compact }: Props) {
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
        'group relative flex w-full items-center justify-center overflow-hidden rounded-xl border transition-all',
        compact ? 'h-16' : 'h-[72px]',
        onClick && 'cursor-pointer active:scale-[0.97]',
        outOfService
          ? 'border-gray-200 bg-gray-100'
          : occupied
            ? 'border-rose-100 bg-rose-50/60 hover:border-rose-200'
            : 'border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50',
      )}
    >
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      )}

      {outOfService ? (
        <div className="flex flex-col items-center gap-1 text-gray-400">
          <Wrench className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">{spot.spot_code}</span>
        </div>
      ) : occupied ? (
        <>
          <CarTopView className="h-[88%] w-auto text-slate-700" />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-white/85 px-1.5 text-[10px] font-semibold text-slate-600">
            {spot.spot_code}
          </span>
        </>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600/80">
          {spot.spot_code}
        </span>
      )}
    </button>
  )
}
