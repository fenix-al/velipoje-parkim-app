'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Car,
  CarFront,
  ChevronDown,
  Info,
  ParkingSquare,
  Percent,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ParkingSpot, Zone, ZoneRowWithSpots, AppRole, SpotStatus, ActiveSession } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { occupySpot, releaseSpot, setSpotOutOfService, restoreSpot } from '@/lib/actions/spots'
import SpotBottomSheet from '@/components/map/SpotBottomSheet'
import OfflineBanner from '@/components/map/OfflineBanner'
import StatCard from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { STATUS_COLORS } from '@/lib/design/status'
import { cn } from '@/lib/utils/cn'
import SpotBox from './SpotBox'
import SpotDetailPanel from './SpotDetailPanel'

interface Props {
  zone: Zone
  initialRows: ZoneRowWithSpots[]
  initialActiveSessions: ActiveSession[]
  userRole: AppRole
  /** Ku kthen shigjeta "mbrapa" — /zones për punonjësit, /admin/zones për panelin. */
  backHref?: string
  /** Chips për të kaluar te zonat e tjera pa u kthyer mbrapa (opsionale). */
  zoneSwitcher?: { code: string; href: string; current: boolean }[]
}

type StatusFilter = 'all' | SpotStatus

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Të gjitha' },
  { value: 'free', label: 'Të lira' },
  { value: 'occupied', label: 'Të zëna' },
  { value: 'out_of_service', label: 'Jashtë shërbimit' },
]

export default function ZoneGridView({
  zone,
  initialRows,
  initialActiveSessions,
  userRole,
  backHref = '/zones',
  zoneSwitcher,
}: Props) {
  const [rows, setRows] = useState<ZoneRowWithSpots[]>(initialRows)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions)
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [pendingSpotId, setPendingSpotId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const supabase = useRef(createClient())

  // ── Online/offline ──────────────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // ── Desktop vs mobile: paneli anësor kundrejt bottom sheet ──────────────
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // ── Reload the full layout from the DB (client-side) ─────────────────────
  // Mirrors getZoneLayout(); used whenever a realtime change arrives so the
  // grid reflects added/removed spots — not just status changes.
  const loadLayout = useCallback(async () => {
    const [{ data }, { data: sessionData }] = await Promise.all([
      supabase.current
      .from('zone_rows')
      .select('*, spots:parking_spots(*)')
      .eq('zone_id', zone.id)
        .order('position', { ascending: true }),
      supabase.current
        .from('v_active_sessions')
        .select('*')
        .eq('zone_id', zone.id),
    ])

    if (!data) return
    const fresh = data as ZoneRowWithSpots[]
    for (const row of fresh) {
      row.spots = (row.spots ?? [])
        .filter((s) => s.is_active)
        .sort((a, b) => a.position - b.position)
    }
    setRows(fresh)
    setActiveSessions((sessionData as ActiveSession[]) ?? [])
    // Keep the open panel/sheet in sync (status change) or close it if the
    // spot was removed.
    setSelectedSpot((prev) => {
      if (!prev) return null
      const found = fresh.flatMap((r) => r.spots).find((s) => s.id === prev.id)
      return found ?? null
    })
  }, [zone.id])

  // ── Realtime: any spot/row change in this zone → reload layout ───────────
  useEffect(() => {
    const channel = supabase.current
      .channel(`zone-grid-${zone.id}`)
      // status changes are frequent: patch in place for instant feedback
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parking_spots',
          filter: `zone_id=eq.${zone.id}`,
        },
        (payload) => {
          const updated = payload.new as ParkingSpot
          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              spots: row.spots.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
            })),
          )
          setSelectedSpot((prev) =>
            prev?.id === updated.id ? { ...prev, ...updated } : prev,
          )
          loadLayout()
        },
      )
      // spots added/removed (admin layout edits) → full reload
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'parking_spots', filter: `zone_id=eq.${zone.id}` },
        () => loadLayout(),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'parking_spots' },
        () => loadLayout(),
      )
      // rows added/removed (default row etj.) → full reload
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zone_rows', filter: `zone_id=eq.${zone.id}` },
        () => loadLayout(),
      )
      .subscribe()

    return () => {
      supabase.current.removeChannel(channel)
    }
  }, [zone.id, loadLayout])

  const handleSpotClick = useCallback((spot: ParkingSpot) => {
    setSelectedSpot(spot)
  }, [])

  const patchSpotStatus = useCallback((spotId: string, status: SpotStatus) => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        spots: row.spots.map((spot) =>
          spot.id === spotId ? { ...spot, current_status: status } : spot,
        ),
      })),
    )
    setSelectedSpot((prev) =>
      prev?.id === spotId ? { ...prev, current_status: status } : prev,
    )
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────
  async function runAction(
    spot: ParkingSpot,
    fn: typeof occupySpot,
    successMsg: string,
  ) {
    if (!isOnline) {
      toast.error('Nuk ka lidhje interneti. Provo më vonë.')
      return
    }
    setPendingSpotId(spot.id)
    try {
      const result = await fn(spot.id, zone.code)
      if (result.success) {
        const nextStatus: SpotStatus =
          fn === occupySpot
            ? 'occupied'
            : fn === releaseSpot || fn === restoreSpot
              ? 'free'
              : 'out_of_service'
        patchSpotStatus(spot.id, nextStatus)
        void loadLayout()
        toast.success(successMsg)
        // Në desktop paneli mbetet i hapur me statusin e ri; në mobile
        // mbyllet bottom sheet-i si më parë.
        if (!isDesktop) setSelectedSpot(null)
      } else {
        toast.error(result.error)
      }
    } finally {
      setPendingSpotId(null)
    }
  }

  const handleOccupy = (s: ParkingSpot) => runAction(s, occupySpot, `Vendi ${s.spot_code} u zë.`)
  const handleRelease = (s: ParkingSpot) => runAction(s, releaseSpot, `Vendi ${s.spot_code} u lirua.`)
  const handleOutOfService = (s: ParkingSpot) =>
    runAction(s, setSpotOutOfService, `Vendi ${s.spot_code} u vendos jashtë shërbimit.`)
  const handleRestore = (s: ParkingSpot) => runAction(s, restoreSpot, `Vendi ${s.spot_code} u rikthye.`)

  // ── Lista e sheshtë e vendeve (rreshtat janë detaj i DB-së) ─────────────
  const allSpots = useMemo(() => rows.flatMap((r) => r.spots), [rows])

  const stats = useMemo(() => {
    const free = allSpots.filter((s) => s.current_status === 'free').length
    const occupied = allSpots.filter((s) => s.current_status === 'occupied').length
    const oos = allSpots.filter((s) => s.current_status === 'out_of_service').length
    return { total: allSpots.length, free, occupied, oos }
  }, [allSpots])

  const activeCapacity = stats.total - stats.oos
  const occupancyPct = activeCapacity > 0
    ? Math.round((stats.occupied / activeCapacity) * 1000) / 10
    : 0

  const filterCounts: Record<StatusFilter, number> = {
    all: stats.total,
    free: stats.free,
    occupied: stats.occupied,
    out_of_service: stats.oos,
  }

  const visibleSpots = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allSpots.filter((spot) => {
      if (statusFilter !== 'all' && spot.current_status !== statusFilter) return false
      if (q && !spot.spot_code.toLowerCase().includes(q)) return false
      return true
    })
  }, [allSpots, query, statusFilter])

  const hasLayout = allSpots.length > 0
  const activeSessionMap = useMemo(
    () => Object.fromEntries(activeSessions.map((session) => [session.spot_id, session])),
    [activeSessions],
  )

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-white to-slate-50">
      {!isOnline && <OfflineBanner />}

      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 md:px-6">
        <Link
          href={backHref}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 md:border md:bg-white md:p-2.5 md:shadow-sm"
          aria-label="Kthehu te zonat"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1 text-center md:text-left">
          <h1 className="truncate text-lg font-bold uppercase tracking-wide text-gray-900">
            {zone.name}
          </h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            Pamje e vendeve të parkimit
          </p>
        </div>

        {/* Legjenda — vetëm desktop */}
        <div className="hidden items-center gap-4 text-xs text-gray-600 md:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.free }} />
            I lirë
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.occupied }} />
            I zënë
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.out_of_service }} />
            Jashtë shërbimit
          </span>
        </div>

        <div className="min-w-[44px] text-right md:rounded-xl md:border md:bg-white md:px-4 md:py-2 md:shadow-sm">
          <span className="text-lg font-bold text-emerald-500 md:text-2xl">{stats.free}</span>
          <span className="ml-1 text-xs text-gray-400">të lira</span>
        </div>
      </header>

      {/* Ndërrimi i zonave pa u kthyer mbrapa */}
      {zoneSwitcher && zoneSwitcher.length > 1 && (
        <nav
          aria-label="Ndërro zonën"
          className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2 md:px-6"
        >
          <span className="shrink-0 text-xs font-medium text-muted-foreground">Zonat:</span>
          {zoneSwitcher.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={cn(
                'flex h-8 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors',
                item.current
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {item.code}
            </Link>
          ))}
        </nav>
      )}

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-6 md:py-5">
        {!hasLayout ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-gray-400">
            <p className="text-sm">Kjo zonë nuk ka ende vende parkimi.</p>
            <p className="text-xs">Admini mund t&apos;i shtojë te paneli i zonave.</p>
          </div>
        ) : (
          <>
            {/* Mobile: kërkim + karta të thjeshta */}
            <div className="md:hidden">
              <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-gray-100 bg-white px-4 pb-3 pt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Kërko vendin (p.sh. V12)..."
                    inputMode="search"
                    className="h-11 pl-9 text-base"
                  />
                </div>
                <div className="-mx-4 mt-2 overflow-x-auto px-4">
                  <div className="flex min-w-max gap-2">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatusFilter(option.value)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                          statusFilter === option.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-gray-200 bg-white text-gray-600',
                        )}
                      >
                        {option.label} ({filterCounts[option.value]})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {visibleSpots.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Asnjë vend nuk përputhet me kërkimin.
                </p>
              ) : (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}
                >
                  {visibleSpots.map((spot) => (
                    <SpotBox
                      key={spot.id}
                      spot={spot}
                      isPending={pendingSpotId === spot.id}
                      isSelected={selectedSpot?.id === spot.id}
                      onClick={handleSpotClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: KPI + grid me kërkim/filtër + panel detajesh */}
            <div className="hidden space-y-4 md:block">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard
                  title="Totali i vendeve"
                  value={stats.total}
                  note="vende"
                  icon={ParkingSquare}
                  tone="blue"
                />
                <StatCard
                  title="Vende të lira"
                  value={stats.free}
                  note="vende"
                  icon={CarFront}
                  tone="green"
                />
                <StatCard
                  title="Vende të zëna"
                  value={stats.occupied}
                  note={stats.occupied === 1 ? 'vend' : 'vende'}
                  icon={Car}
                  tone="red"
                />
                <StatCard
                  title="Shkalla e zënies"
                  value={`${occupancyPct}%`}
                  note={`${stats.occupied} / ${stats.total}`}
                  icon={Percent}
                  tone="violet"
                />
              </div>

              <div className="flex items-start gap-4">
                <Card className="min-w-0 flex-1">
                  <CardContent className="p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Kërko vend..."
                          className="h-10 pl-9"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                          aria-label="Filtro sipas statusit"
                          className="h-10 appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          {FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} ({filterCounts[option.value]})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                      </div>
                    </div>

                    {visibleSpots.length === 0 ? (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        Asnjë vend nuk përputhet me kërkimin.
                      </p>
                    ) : (
                      <div
                        className="grid gap-2.5"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
                      >
                        {visibleSpots.map((spot) => (
                          <SpotBox
                            key={spot.id}
                            spot={spot}
                            isPending={pendingSpotId === spot.id}
                            isSelected={selectedSpot?.id === spot.id}
                            onClick={handleSpotClick}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="w-80 shrink-0">
                  <SpotDetailPanel
                    zone={zone}
                    spot={selectedSpot}
                    activeSession={selectedSpot ? activeSessionMap[selectedSpot.id] : undefined}
                    userRole={userRole}
                    isOnline={isOnline}
                    isPending={selectedSpot ? pendingSpotId === selectedSpot.id : false}
                    onOccupy={handleOccupy}
                    onRelease={handleRelease}
                    onOutOfService={handleOutOfService}
                    onRestore={handleRestore}
                  />
                </div>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Të dhënat përditësohen automatikisht në kohë reale.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom sheet — vetëm mobile; në desktop përdoret paneli anësor */}
      {selectedSpot && !isDesktop && (
        <SpotBottomSheet
          spot={selectedSpot}
          activeSession={activeSessionMap[selectedSpot.id]}
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
