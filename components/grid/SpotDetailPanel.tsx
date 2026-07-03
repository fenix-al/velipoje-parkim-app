'use client'

import { CalendarClock, Clock3, Loader2, MapPin, MousePointerClick, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import LiveDuration from '@/components/shared/LiveDuration'
import type { ActiveSession, AppRole, ParkingSpot, Zone } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'
import { formatLocal } from '@/lib/utils/time'

interface Props {
  zone: Zone
  spot: ParkingSpot | null
  activeSession?: ActiveSession
  userRole: AppRole
  isOnline: boolean
  isPending: boolean
  onOccupy: (spot: ParkingSpot) => void
  onRelease: (spot: ParkingSpot) => void
  onOutOfService: (spot: ParkingSpot) => void
  onRestore: (spot: ParkingSpot) => void
}

const STATUS_META: Record<
  string,
  { label: string; badge: 'success' | 'destructive' | 'secondary'; headerClass: string }
> = {
  free: {
    label: 'I lirë',
    badge: 'success',
    headerClass: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
  },
  occupied: {
    label: 'I zënë',
    badge: 'destructive',
    headerClass: 'border-red-100 bg-red-50/70 text-red-700',
  },
  out_of_service: {
    label: 'Jashtë shërbimit',
    badge: 'secondary',
    headerClass: 'border-gray-200 bg-gray-100 text-gray-500',
  },
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right font-semibold text-gray-900">{value}</span>
    </div>
  )
}

/** Paneli anësor i detajeve të vendit — vetëm për pamjen desktop. */
export default function SpotDetailPanel({
  zone,
  spot,
  activeSession,
  userRole,
  isOnline,
  isPending,
  onOccupy,
  onRelease,
  onOutOfService,
  onRestore,
}: Props) {
  const canManageService = userRole === 'admin'

  if (!spot) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="rounded-full bg-slate-100 p-3">
            <MousePointerClick className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Zgjidh një vend</p>
          <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
            Kliko një vend në grid për të parë detajet dhe për të kryer veprime.
          </p>
        </CardContent>
      </Card>
    )
  }

  const meta = STATUS_META[spot.current_status] ?? STATUS_META.out_of_service

  return (
    <Card className="overflow-hidden">
      <div className={cn('border-b p-5', meta.headerClass)}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xl font-bold">{spot.spot_code}</span>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="divide-y">
          <DetailRow icon={MapPin} label="Zona" value={zone.name} />
          {spot.current_status === 'occupied' && (
            <>
              <DetailRow
                icon={User}
                label="Zënë nga"
                value={activeSession?.occupied_by_name || 'Punonjës'}
              />
              <DetailRow
                icon={CalendarClock}
                label="Hyrja"
                value={activeSession ? formatLocal(activeSession.occupied_at, 'dd/MM HH:mm') : '—'}
              />
              <DetailRow
                icon={Clock3}
                label="Kohëzgjatja"
                value={
                  activeSession ? (
                    <LiveDuration since={activeSession.occupied_at} className="text-red-600" />
                  ) : (
                    '—'
                  )
                }
              />
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {spot.current_status === 'free' && (
            <Button
              onClick={() => onOccupy(spot)}
              disabled={isPending || !isOnline}
              className="h-11 w-full bg-green-600 text-white hover:bg-green-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
              className="h-11 w-full bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
              className="h-11 w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
      </CardContent>
    </Card>
  )
}
