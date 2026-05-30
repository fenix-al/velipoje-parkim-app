'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { formatLocal } from '@/lib/utils/time'
import type { SpotEventWithDetails } from '@/lib/db/queries'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
  events: SpotEventWithDetails[]
  total: number
  page: number
  pageSize: number
  eventType: string
}

const EVENT_LABELS: Record<string, string> = {
  occupied:           'Zënë',
  released:           'Liruar',
  out_of_service:     'Jashtë shërbimit',
  restored:           'Rikthyer',
  manual_correction:  'Korrigjim manual',
}

const EVENT_VARIANTS: Record<string, 'success' | 'destructive' | 'secondary' | 'warning' | 'default'> = {
  occupied:           'destructive',
  released:           'success',
  out_of_service:     'secondary',
  restored:           'default',
  manual_correction:  'warning',
}

const EVENT_OPTIONS = [
  { value: 'all', label: 'Te gjitha' },
  { value: 'occupied', label: EVENT_LABELS.occupied },
  { value: 'released', label: EVENT_LABELS.released },
  { value: 'out_of_service', label: EVENT_LABELS.out_of_service },
  { value: 'restored', label: EVENT_LABELS.restored },
  { value: 'manual_correction', label: EVENT_LABELS.manual_correction },
]

type PageItem = number | 'ellipsis'

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage])

  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)
  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 3)
    pages.add(totalPages - 2)
    pages.add(totalPages - 1)
  }

  const sortedPages = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)

  const items: PageItem[] = []
  sortedPages.forEach((item, index) => {
    const previous = sortedPages[index - 1]
    if (previous && item - previous > 1) {
      items.push('ellipsis')
    }
    items.push(item)
  })

  return items
}

export default function ActivityTable({ events, total, page, pageSize, eventType }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)
  const pageItems = getPageItems(page, totalPages)

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-base">Aktiviteti i fundit</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {total === 0 ? '0 rezultate' : `${firstItem}-${lastItem} nga ${total}`}
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:w-44">
          <Label htmlFor="activity-event" className="text-xs">Veprimi</Label>
          <div className="relative">
            <select
              id="activity-event"
              value={eventType || 'all'}
              disabled={pending}
              onChange={(event) => updateParams({
                event: event.target.value === 'all' ? '' : event.target.value,
                activityPage: '',
              })}
              className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {EVENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y md:hidden">
          {events.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nuk ka aktivitet per t'u shfaqur.
            </div>
          )}
          {events.map((ev) => (
            <div key={ev.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {ev.zone_code} · {ev.spot_code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatLocal(ev.performed_at, 'dd/MM HH:mm')}
                  </p>
                </div>
                <Badge variant={EVENT_VARIANTS[ev.event_type] ?? 'default'}>
                  {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {ev.performer_name || 'Pa punonjes'}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Koha</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Zona</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vend</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Veprimi</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Punonjësi</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nuk ka aktivitet për t'u shfaqur.
                  </td>
                </tr>
              )}
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatLocal(ev.performed_at, 'dd/MM HH:mm')}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{ev.zone_code}</td>
                  <td className="px-4 py-2.5">{ev.spot_code}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={EVENT_VARIANTS[ev.event_type] ?? 'default'}>
                      {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {ev.performer_name || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-muted-foreground">
            Faqja {page} nga {totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pending || page <= 1}
              onClick={() => updateParams({ activityPage: String(page - 1) })}
            >
              Mbrapa
            </Button>
            {pageItems.map((item, index) => (
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 text-sm text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? 'default' : 'outline'}
                  size="sm"
                  disabled={pending || item === page}
                  aria-current={item === page ? 'page' : undefined}
                  className="h-8 min-w-8 px-2"
                  onClick={() => updateParams({ activityPage: String(item) })}
                >
                  {item}
                </Button>
              )
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={pending || page >= totalPages}
              onClick={() => updateParams({ activityPage: String(page + 1) })}
            >
              Para
            </Button>
            {totalPages > 1 && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending || page >= totalPages}
                onClick={() => updateParams({ activityPage: String(totalPages) })}
              >
                E fundit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
