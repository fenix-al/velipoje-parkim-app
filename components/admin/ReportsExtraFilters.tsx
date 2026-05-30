'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import type React from 'react'
import { ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/supabase/types'

interface Props {
  employees: Profile[]
}

export default function ReportsExtraFilters({ employees }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete('page')
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  const employee = searchParams.get('employee') ?? 'all'
  const minDuration = searchParams.get('minDuration') ?? 'all'
  const sort = searchParams.get('sort') ?? 'latest'

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-3 sm:grid-cols-3 sm:p-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="report-employee" className="text-xs">Punonjës</Label>
        <SelectShell>
          <select
            id="report-employee"
            value={employee}
            disabled={pending}
            onChange={(event) => updateParams({ employee: event.target.value === 'all' ? '' : event.target.value })}
            className={selectClassName}
          >
            <option value="all">Të gjithë</option>
            {employees.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || profile.email}
              </option>
            ))}
          </select>
        </SelectShell>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="report-duration" className="text-xs">Kohëzgjatje minimale</Label>
        <SelectShell>
          <select
            id="report-duration"
            value={minDuration}
            disabled={pending}
            onChange={(event) => updateParams({ minDuration: event.target.value === 'all' ? '' : event.target.value })}
            className={selectClassName}
          >
            <option value="all">Çdo kohë</option>
            <option value="30">Mbi 30 min</option>
            <option value="60">Mbi 1 orë</option>
            <option value="120">Mbi 2 orë</option>
          </select>
        </SelectShell>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="report-sort" className="text-xs">Renditja</Label>
        <SelectShell>
          <select
            id="report-sort"
            value={sort}
            disabled={pending}
            onChange={(event) => updateParams({ sort: event.target.value === 'latest' ? '' : event.target.value })}
            className={selectClassName}
          >
            <option value="latest">Më të fundit</option>
            <option value="longest">Më të gjatat</option>
          </select>
        </SelectShell>
      </div>
    </div>
  )
}

const selectClassName =
  'h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  )
}
