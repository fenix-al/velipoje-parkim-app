'use client'

import { useEffect, useRef } from 'react'
import { Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ActiveSession, AppRole, ParkingSpot } from '@/lib/supabase/types'
import { formatDuration, formatLocal } from '@/lib/utils/time'

interface Props {
  spot: ParkingSpot
  activeSession?: ActiveSession
  userRole: AppRole
  isOnline: boolean
  isPending: boolean
  onOccupy: (spot: ParkingSpot) => void
  onRelease: (spot: ParkingSpot) => void
  onOutOfService: (spot: ParkingSpot) => void
  onRestore: (spot: ParkingSpot) => void
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  free: 'I lirë',
  occupied: 'I zënë',
  out_of_service: 'Jashtë shërbimit',
}

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'destructive' | 'secondary'> = {
  free: 'success',
  occupied: 'destructive',
  out_of_service: 'secondary',
}

export default function SpotBottomSheet({
  spot,
  activeSession,
  userRole,
  isOnline,
  isPending,
  onOccupy,
  onRelease,
  onOutOfService,
  onRestore,
  onClose,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const canManageService = userRole === 'admin'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      <div className="absolute inset-0 z-40 bg-black/30" aria-hidden="true" />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Vend parkimi ${spot.spot_code}`}
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-250 md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">{spot.spot_code}</span>
            <Badge variant={STATUS_BADGE_VARIANT[spot.current_status] ?? 'secondary'}>
              {STATUS_LABELS[spot.current_status] ?? spot.current_status}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {spot.current_status === 'occupied' && (
          <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-red-100 bg-red-50/70 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Zënë nga</span>
              <span className="truncate font-semibold text-gray-900">
                {activeSession?.occupied_by_name || 'Punonjës'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Ora e zënies</span>
              <span className="font-semibold text-gray-900">
                {activeSession ? formatLocal(activeSession.occupied_at, 'dd/MM HH:mm') : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Qëndrim aktual</span>
              <span className="font-semibold text-gray-900">
                {activeSession ? formatDuration(activeSession.minutes_so_far) : '-'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {spot.current_status === 'free' && (
            <Button
              onClick={() => onOccupy(spot)}
              disabled={isPending || !isOnline}
              className="h-12 w-full bg-green-600 text-base text-white hover:bg-green-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Duke zënë...
                </>
              ) : (
                'Zë vendin'
              )}
            </Button>
          )}

          {spot.current_status === 'occupied' && (
            <Button
              onClick={() => onRelease(spot)}
              disabled={isPending || !isOnline}
              className="h-12 w-full bg-red-600 text-base text-white hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Duke liruar...
                </>
              ) : (
                'Liro vendin'
              )}
            </Button>
          )}

          {canManageService && spot.current_status === 'free' && (
            <Button
              variant="outline"
              onClick={() => onOutOfService(spot)}
              disabled={isPending || !isOnline}
              className="h-10 w-full text-sm text-gray-600"
            >
              Vendos jashtë shërbimit
            </Button>
          )}

          {canManageService && spot.current_status === 'out_of_service' && (
            <Button
              onClick={() => onRestore(spot)}
              disabled={isPending || !isOnline}
              className="h-12 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Duke rikthyer...
                </>
              ) : (
                'Rikthe vendin'
              )}
            </Button>
          )}
        </div>

        {!isOnline && (
          <p className="mt-3 text-center text-xs text-amber-600">
            Veprimet janë të çaktivizuara: nuk ka lidhje interneti.
          </p>
        )}
      </div>
    </>
  )
}
