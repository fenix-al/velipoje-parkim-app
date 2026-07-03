'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, ExternalLink, X, Loader2, ParkingSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Zone, ZoneRowWithSpots, ParkingSpot } from '@/lib/supabase/types'
import { addSpot, addSpotsBulk, renameSpot, deleteSpot } from '@/lib/actions/zones'
import { CarTopView } from '@/components/grid/ParkingStall'

interface Props {
  zone: Zone
  initialRows: ZoneRowWithSpots[]
}

function SpotChip({
  spot,
  zoneId,
  onMutate,
}: {
  spot: ParkingSpot
  zoneId: string
  onMutate: () => void
}) {
  const [code, setCode] = useState(spot.spot_code)
  const [isPending, startTransition] = useTransition()
  const occupied = spot.current_status !== 'free'

  function save() {
    if (code.trim() === spot.spot_code) return
    startTransition(async () => {
      const res = await renameSpot(spot.id, zoneId, code)
      if (res?.error) {
        toast.error(res.error)
        setCode(spot.spot_code)
      } else {
        onMutate()
      }
    })
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteSpot(spot.id, zoneId)
      if (res?.error) toast.error(res.error)
      else onMutate()
    })
  }

  return (
    <div className="relative flex w-20 flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white p-2">
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-0.5 text-white shadow hover:bg-rose-600 disabled:opacity-50"
        aria-label="Fshi vendin"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>
      <div className="flex h-10 w-full items-center justify-center rounded bg-slate-50">
        {occupied ? (
          <CarTopView className="h-9 w-auto text-slate-600" />
        ) : (
          <span className="text-[10px] font-medium uppercase text-emerald-500">i lirë</span>
        )}
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onBlur={save}
        title="Ndrysho emrin/kodin e vendit"
        placeholder="Emri"
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className="w-full rounded border border-transparent bg-transparent text-center text-xs font-semibold text-gray-700 hover:border-gray-200 focus:border-blue-400 focus:outline-none"
      />
    </div>
  )
}

export default function ZoneLayoutEditor({ zone, initialRows }: Props) {
  const router = useRouter()
  const [newSpotCode, setNewSpotCode] = useState('')
  const [bulkCount, setBulkCount] = useState('')
  const [isPending, startTransition] = useTransition()

  // Rreshtat në DB janë detaj teknik — editori punon me listën e sheshtë.
  const spots = useMemo(() => initialRows.flatMap((r) => r.spots), [initialRows])

  const onMutate = () => router.refresh()

  function handleAddSpot() {
    startTransition(async () => {
      const res = await addSpot(zone.id, newSpotCode)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setNewSpotCode('')
        onMutate()
      }
    })
  }

  function handleAddBulk() {
    const n = parseInt(bulkCount, 10)
    if (!Number.isFinite(n) || n < 1) {
      toast.error('Vendos një numër të vlefshëm vendesh (1–100).')
      return
    }
    if (n > 100) {
      toast.error('Mund të shtoni deri në 100 vende njëherësh.')
      return
    }
    startTransition(async () => {
      const res = await addSpotsBulk(zone.id, n)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setBulkCount('')
        toast.success(`U shtuan ${n} vende.`)
        onMutate()
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/zones"
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Kthehu te zonat"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendet — {zone.name}</h1>
            <p className="text-xs text-muted-foreground">
              {spots.length} vende gjithsej. Shto një nga një ose shumë njëherësh; kliko emrin për ta ndryshuar.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/zones/${zone.id}/view`}>
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Shiko pamjen
          </Link>
        </Button>
      </div>

      {/* Shtimi i vendeve */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-spot-code" className="text-xs font-medium text-gray-600">
            Shto një vend (emri opsional)
          </label>
          <div className="flex gap-1.5">
            <Input
              id="new-spot-code"
              value={newSpotCode}
              onChange={(e) => setNewSpotCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSpot()
              }}
              placeholder="Bosh = auto (V01…)"
              className="h-9 w-40 text-sm"
              disabled={isPending}
            />
            <Button size="sm" className="h-9" onClick={handleAddSpot} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Shto
            </Button>
          </div>
        </div>

        <div className="hidden h-9 border-l border-gray-200 sm:block" />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bulk-count" className="text-xs font-medium text-gray-600">
            Shto shumë njëherësh (1–100)
          </label>
          <div className="flex gap-1.5">
            <Input
              id="bulk-count"
              type="number"
              min={1}
              max={100}
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddBulk()
              }}
              placeholder="p.sh. 34"
              className="h-9 w-24 text-sm"
              disabled={isPending}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-primary/30 text-primary hover:bg-primary/5"
              onClick={handleAddBulk}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Shto N
            </Button>
          </div>
        </div>
      </div>

      {/* Vendet */}
      {spots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16 text-muted-foreground">
          <ParkingSquare className="h-10 w-10 opacity-30" />
          <p className="text-sm">Nuk ka vende ende. Shto vendet e para më lart.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex flex-wrap gap-3">
            {spots.map((spot) => (
              <SpotChip key={spot.id} spot={spot} zoneId={zone.id} onMutate={onMutate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
