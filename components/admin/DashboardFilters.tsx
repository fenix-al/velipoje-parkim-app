'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'

const ZONES = ['', 'Z1', 'Z2', 'Z3', 'Z4']

interface Props {
  onExportCSV?: () => void
}

export default function DashboardFilters({ onExportCSV }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const from     = searchParams.get('from') ?? ''
  const to       = searchParams.get('to')   ?? ''
  const zoneCode = searchParams.get('zone') ?? ''

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => router.replace(`${pathname}?${params.toString()}`))
    },
    [pathname, router, searchParams]
  )

  function reset() {
    startTransition(() => router.replace(pathname))
  }

  const hasFilters = from || to || zoneCode

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Date from */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="from" className="text-xs">Nga data</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => updateParams('from', e.target.value)}
            className="w-36 h-9 text-sm"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="to" className="text-xs">Deri më</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => updateParams('to', e.target.value)}
            className="w-36 h-9 text-sm"
          />
        </div>

        {/* Zone */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Zona</Label>
          <Select value={zoneCode} onValueChange={(v) => updateParams('zone', v)}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Të gjitha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Të gjitha</SelectItem>
              {ZONES.filter(Boolean).map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={pending}
            className="text-muted-foreground h-9"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Pastro
          </Button>
        )}

        {/* CSV Export */}
        {onExportCSV && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="ml-auto h-9"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Eksporto CSV
          </Button>
        )}
      </div>
    </div>
  )
}
