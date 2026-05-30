'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Rows3, ExternalLink, X, Loader2, ArrowUp, ArrowDown, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Zone, ZoneRowWithSpots, ParkingSpot } from '@/lib/supabase/types'
import {
  createRow,
  renameRow,
  deleteRow,
  addSpotToRow,
  renameSpot,
  deleteSpot,
  setZoneEntry,
} from '@/lib/actions/zones'
import { cn } from '@/lib/utils/cn'
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

function RowCard({
  row,
  index,
  zoneId,
  onMutate,
}: {
  row: ZoneRowWithSpots
  index: number
  zoneId: string
  onMutate: () => void
}) {
  const [label, setLabel] = useState(row.label ?? '')
  const [newSpotCode, setNewSpotCode] = useState('')
  const [isPending, startTransition] = useTransition()

  function saveLabel() {
    if ((label.trim() || null) === (row.label ?? null)) return
    startTransition(async () => {
      const res = await renameRow(row.id, zoneId, label)
      if (res?.error) toast.error(res.error)
      else onMutate()
    })
  }

  function addSpot() {
    startTransition(async () => {
      const res = await addSpotToRow(zoneId, row.id, newSpotCode)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setNewSpotCode('')
        onMutate()
      }
    })
  }

  function removeRow() {
    startTransition(async () => {
      const res = await deleteRow(row.id, zoneId)
      if (res?.error) toast.error(res.error)
      else onMutate()
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {index + 1}
        </span>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          placeholder={`Rreshti ${index + 1}`}
          className="h-8 max-w-[200px] text-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{row.spots.length} vende</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={removeRow}
            disabled={isPending}
            aria-label="Fshi rreshtin"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {row.spots.map((spot) => (
          <SpotChip key={spot.id} spot={spot} zoneId={zoneId} onMutate={onMutate} />
        ))}
        <div className="flex h-[92px] w-32 flex-col justify-between rounded-lg border-2 border-dashed border-gray-300 bg-white p-2">
          <Input
            value={newSpotCode}
            onChange={(e) => setNewSpotCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addSpot()
            }}
            placeholder="Emri vendit"
            className="h-8 text-xs"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={addSpot}
            disabled={isPending}
            className="flex h-8 items-center justify-center gap-1 rounded-md bg-blue-600 px-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Shto
          </button>
          <span className="text-center text-[10px] text-gray-400">Bosh = auto</span>
        </div>
      </div>
    </div>
  )
}

export default function ZoneLayoutEditor({ zone, initialRows }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // initialRows comes fresh from the server on each refresh; use it directly.
  const rows = initialRows

  const onMutate = () => router.refresh()

  function addRow() {
    startTransition(async () => {
      const res = await createRow(zone.id)
      if (res?.error) toast.error(res.error)
      else router.refresh()
    })
  }

  function changeEntry(position: 'top' | 'bottom' | 'none') {
    if (position === zone.entry_position) return
    startTransition(async () => {
      const res = await setZoneEntry(zone.id, position)
      if (res?.error) toast.error(res.error)
      else router.refresh()
    })
  }

  const entryOptions = [
    { value: 'top' as const, label: 'Lart', icon: ArrowUp },
    { value: 'bottom' as const, label: 'Poshtë', icon: ArrowDown },
    { value: 'none' as const, label: 'Hiq', icon: Ban },
  ]

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
            <h1 className="text-xl font-bold text-gray-900">Layout — {zone.name}</h1>
            <p className="text-xs text-muted-foreground">
              Shto rreshta dhe vende parkimi. Rreshtat çiftohen majtas/djathtas në pamjen e punonjësit.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/zones/${zone.code}`} target="_blank">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Shiko pamjen
          </Link>
        </Button>
      </div>

      {/* Entry position */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
        <span className="text-sm font-medium text-gray-700">Hyrja (Hyrje):</span>
        <div className="flex gap-1.5">
          {entryOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => changeEntry(value)}
              disabled={isPending}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                zone.entry_position === value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16 text-muted-foreground">
          <Rows3 className="h-10 w-10 opacity-30" />
          <p className="text-sm">Nuk ka rreshta. Shto rreshtin e parë.</p>
          <Button variant="outline" size="sm" onClick={addRow} disabled={isPending}>
            <Plus className="mr-1.5 h-4 w-4" />
            Shto rresht
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <RowCard key={row.id} row={row} index={i} zoneId={zone.id} onMutate={onMutate} />
          ))}

          <Button variant="outline" className="w-full" onClick={addRow} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-4 w-4" />
            )}
            Shto rresht
          </Button>
        </div>
      )}
    </div>
  )
}
