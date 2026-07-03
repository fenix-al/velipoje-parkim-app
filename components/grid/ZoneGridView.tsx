'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import type { ParkingSpot, Zone, ZoneRowWithSpots, AppRole, SpotStatus, ActiveSession } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { occupySpot, releaseSpot, setSpotOutOfService, restoreSpot } from '@/lib/actions/spots'
import SpotBottomSheet from '@/components/map/SpotBottomSheet'
import OfflineBanner from '@/components/map/OfflineBanner'
import ParkingStall from './ParkingStall'
import SpotBox from './SpotBox'

interface Props {
  zone: Zone
  initialRows: ZoneRowWithSpots[]
  initialActiveSessions: ActiveSession[]
  userRole: AppRole
}

function freeCount(rows: ZoneRowWithSpots[]) {
  return rows.reduce(
    (sum, r) => sum + r.spots.filter((s) => s.current_status === 'free').length,
    0,
  )
}

/** Vertical aisle label, e.g. the "4 SLOTS FREE" strip from the design. */
function AisleLabel({ free }: { free: number }) {
  return (
    <div className="flex min-w-[44px] flex-col items-center justify-center px-1">
      <span
        className="whitespace-nowrap text-sm font-semibold tracking-[0.2em] text-slate-300"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {free} VENDE TË LIRA
      </span>
    </div>
  )
}

/** Small entry arrow pointing into the lot. */
function EntryMarker({ at }: { at: 'top' | 'bottom' }) {
  const Arrow = at === 'top' ? ArrowDown : ArrowUp
  return (
    <div className="flex flex-col items-center gap-0.5 text-emerald-500">
      {at === 'bottom' && (
        <span className="text-[11px] font-semibold uppercase tracking-widest">Hyrje</span>
      )}
      <Arrow className="h-6 w-6" strokeWidth={2.5} />
      {at === 'top' && (
        <span className="text-[11px] font-semibold uppercase tracking-widest">Hyrje</span>
      )}
    </div>
  )
}

function RowColumn({
  row,
  pendingSpotId,
  onSpotClick,
}: {
  row: ZoneRowWithSpots
  pendingSpotId: string | null
  onSpotClick: (s: ParkingSpot) => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {row.spots.length === 0 ? (
        <div className="flex h-[72px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-300">
          Bosh
        </div>
      ) : (
        row.spots.map((spot) => (
          <ParkingStall
            key={spot.id}
            spot={spot}
            isPending={pendingSpotId === spot.id}
            onClick={onSpotClick}
          />
        ))
      )}
    </div>
  )
}

export default function ZoneGridView({ zone, initialRows, initialActiveSessions, userRole }: Props) {
  const [rows, setRows] = useState<ZoneRowWithSpots[]>(initialRows)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions)
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [pendingSpotId, setPendingSpotId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
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

  // ── Reload the full layout from the DB (client-side) ─────────────────────
  // Mirrors getZoneLayout(); used whenever a realtime change arrives so the
  // grid reflects added/removed rows & spots — not just status changes.
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
    // Keep the open bottom sheet in sync (status change) or close it if the
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
      // rows added/renamed/removed → full reload
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
        setSelectedSpot(null)
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

  // ── Pair rows two-by-two for the aisle layout (mobile) ──────────────────
  const pairs = useMemo(() => {
    const out: ZoneRowWithSpots[][] = []
    for (let i = 0; i < rows.length; i += 2) out.push(rows.slice(i, i + 2))
    return out
  }, [rows])

  // ── Flat list in row order for the simple desktop grid ──────────────────
  const allSpots = useMemo(() => rows.flatMap((r) => r.spots), [rows])

  const totalFree = freeCount(rows)
  const hasLayout = rows.some((r) => r.spots.length > 0)
  const activeSessionMap = useMemo(
    () => Object.fromEntries(activeSessions.map((session) => [session.spot_id, session])),
    [activeSessions],
  )

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-white to-slate-50">
      {!isOnline && <OfflineBanner />}

      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Link
          href="/zones"
          className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label="Kthehu te zonat"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-lg font-bold uppercase tracking-wide text-gray-900">{zone.name}</h1>
        </div>

        {/* Legjenda — vetëm desktop */}
        <div className="hidden items-center gap-4 text-xs text-gray-500 md:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" />
            I lirë
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-red-200 bg-red-50" />
            I zënë
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-gray-200 bg-gray-100" />
            Jashtë shërbimit
          </span>
        </div>

        <div className="min-w-[44px] text-right">
          <span className="text-lg font-bold text-emerald-500">{totalFree}</span>
          <span className="ml-1 text-xs text-gray-400">lirë</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        {!hasLayout ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-gray-400">
            <p className="text-sm">Kjo zonë nuk ka ende një layout.</p>
            <p className="text-xs">Admini mund ta krijojë te paneli i zonave.</p>
          </div>
        ) : (
          <>
            {/* Mobile: layout si parkim real me korsi */}
            <div className="mx-auto flex max-w-md flex-col gap-8 md:hidden">
              {zone.entry_position === 'top' && <EntryMarker at="top" />}
              {pairs.map((pair, i) => {
                if (pair.length === 2) {
                  return (
                    <div key={i} className="flex items-stretch gap-2">
                      <RowColumn row={pair[0]} pendingSpotId={pendingSpotId} onSpotClick={handleSpotClick} />
                      <AisleLabel free={freeCount(pair)} />
                      <RowColumn row={pair[1]} pendingSpotId={pendingSpotId} onSpotClick={handleSpotClick} />
                    </div>
                  )
                }
                // Single leftover row → label on the side
                return (
                  <div key={i} className="flex items-stretch gap-2">
                    <RowColumn row={pair[0]} pendingSpotId={pendingSpotId} onSpotClick={handleSpotClick} />
                    <AisleLabel free={freeCount(pair)} />
                  </div>
                )
              })}

              {zone.entry_position === 'bottom' && <EntryMarker at="bottom" />}
            </div>

            {/* Desktop: grid i thjeshtë me kuti sa gjithë gjerësia */}
            <div
              className="hidden gap-2.5 md:grid"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}
            >
              {allSpots.map((spot) => (
                <SpotBox
                  key={spot.id}
                  spot={spot}
                  isPending={pendingSpotId === spot.id}
                  onClick={handleSpotClick}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom sheet */}
      {selectedSpot && (
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
