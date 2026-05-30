'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CalendarDays, ChevronDown, Download, RefreshCw } from 'lucide-react'

const ZONES = ['Z1', 'Z2', 'Z3', 'Z4']

interface Props {
  onExportCSV?: () => void
}

function displayDate(value: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export default function DashboardFilters({ onExportCSV }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
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
    [pathname, router, searchParams],
  )

  function reset() {
    startTransition(() => router.replace(pathname))
  }

  const hasFilters = from || to || zoneCode

  return (
    <div className="space-y-4 rounded-lg border bg-white p-3 shadow-sm sm:p-4">
      <div className="grid grid-cols-3 items-end gap-3 sm:flex sm:flex-wrap sm:gap-4">
        <DateField
          id="from"
          label="Nga data"
          value={from}
          placeholder="mm/dd/yyyy"
          disabled={pending}
          onChange={(value) => updateParams('from', value)}
        />

        <DateField
          id="to"
          label="Deri më"
          value={to}
          placeholder="mm/dd/yyyy"
          disabled={pending}
          onChange={(value) => updateParams('to', value)}
        />

        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor="zone" className="text-[11px] font-medium sm:text-xs">Zona</Label>
          <div className="relative h-9">
            <select
              id="zone"
              aria-label="Zona"
              className="h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-background px-2 py-1 pr-7 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-36 sm:px-3 sm:pr-8 sm:text-sm"
              disabled={pending}
              value={zoneCode || 'all'}
              onChange={(e) => updateParams('zone', e.target.value === 'all' ? '' : e.target.value)}
            >
              <option value="all">Te gjitha</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 sm:right-2.5" />
          </div>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={pending}
            className="h-9 justify-start text-muted-foreground sm:justify-center"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Pastro
          </Button>
        )}

        {onExportCSV && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="h-9 justify-start sm:ml-auto sm:justify-center"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Eksporto CSV
          </Button>
        )}
      </div>
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id} className="text-[11px] font-medium sm:text-xs">{label}</Label>
      <div className="relative h-9">
        <input
          id={id}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="peer absolute inset-0 h-9 w-full min-w-0 cursor-pointer opacity-0"
        />
        <div className="pointer-events-none flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-background px-2 text-xs ring-offset-background peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 sm:w-36 sm:px-3 sm:text-sm">
          <span className={value ? 'truncate text-gray-900' : 'truncate text-muted-foreground'}>
            {value ? displayDate(value) : placeholder}
          </span>
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-500 sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  )
}
