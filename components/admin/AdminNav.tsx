'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  History,
  Map,
  Users,
  Settings,
  MapPin,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { signOut } from '@/lib/actions/auth'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/reports',   label: 'Raporte',     icon: FileText },
  { href: '/admin/history',   label: 'Historiku',   icon: History },
  { href: '/admin/zones',     label: 'Zonat',       icon: Map },
  { href: '/admin/users',     label: 'Përdoruesit', icon: Users },
  { href: '/admin/settings',  label: 'Cilësimet',   icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden min-h-screen w-56 flex-shrink-0 flex-col bg-gray-900 text-white md:flex">
        <div className="flex items-center gap-2 border-b border-gray-700 px-3 py-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
            P
          </div>
          <span className="truncate text-sm font-semibold text-white">
            Parkimi Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}

          <div className="border-t border-gray-700 pt-2">
            <Link
              href="/zones"
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span>Pamja punonjes</span>
            </Link>
          </div>
        </nav>

        <div className="border-t border-gray-700 px-2 py-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-red-700 hover:text-white"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Dil</span>
            </button>
          </form>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 pb-3 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1.5">
          {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors',
                  active
                    ? 'min-h-[58px] scale-[1.03] bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 active:bg-gray-100',
                )}
              >
                <Icon className={cn('flex-shrink-0', active ? 'h-5 w-5' : 'h-4 w-4')} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
