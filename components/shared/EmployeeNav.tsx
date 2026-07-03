'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  User,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import BottomNav from '@/components/shared/BottomNav'
import { signOut } from '@/lib/actions/auth'
import type { Profile, Zone } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  profile: Profile
  zones: Zone[]
}

const ADMIN_MOBILE_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/reports', label: 'Raporte', icon: FileText },
  { href: '/admin/history', label: 'Historiku', icon: History },
  { href: '/admin/zones', label: 'Zonat', icon: Map },
  { href: '/admin/users', label: 'Përdoruesit', icon: Users },
]

const SUPERVISOR_MOBILE_NAV = ADMIN_MOBILE_NAV.filter(
  (item) => item.href !== '/admin/users',
)

const EMPLOYEE_MOBILE_NAV = [
  { href: '/zones', label: 'Zonat', icon: Map },
  { href: '/history', label: 'Historiku', icon: History },
  { href: '/profile', label: 'Profili', icon: User },
]

function formatClock(date: Date) {
  return date.toLocaleTimeString('sq-AL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDate(date: Date) {
  return date.toLocaleDateString('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function EmployeeNav({ profile, zones }: Props) {
  const pathname = usePathname()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const initials = useMemo(
    () => (profile.full_name ?? profile.email)
      .split(' ')
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase(),
    [profile.email, profile.full_name],
  )

  const displayName = profile.full_name ?? profile.email
  const mobileNav =
    profile.role === 'admin'
      ? ADMIN_MOBILE_NAV
      : profile.role === 'supervisor'
        ? SUPERVISOR_MOBILE_NAV
        : EMPLOYEE_MOBILE_NAV

  return (
    <>
      <header className="z-20 flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-ring/50">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarFallback className="bg-slate-900 text-xs text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex cursor-pointer items-center gap-2">
                  <User className="h-4 w-4" />
                  Profili im
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut}>
                  <button type="submit" className="flex w-full items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Dil
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {now ? formatClock(now) : '--:--'}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {now ? formatDate(now) : ''}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2">
          <Link
            href="/zones"
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors',
              pathname === '/zones'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            <MapPin className="h-4 w-4" />
            Zonat
          </Link>
          {zones.map((zone) => {
            const href = `/zones/${zone.code}`
            const active = pathname === href
            return (
              <Link
                key={zone.id}
                href={href}
                className={cn(
                  'flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {zone.code}
              </Link>
            )
          })}
        </nav>
      </header>

      <BottomNav items={mobileNav} />
    </>
  )
}
