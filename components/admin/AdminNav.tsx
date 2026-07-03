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
import BottomNav from '@/components/shared/BottomNav'

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
      <aside className="hidden min-h-screen w-60 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-4 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold shadow-sm">
            P
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">
              Parkimi Velipojë
            </p>
            <p className="text-[11px] text-slate-400">Paneli i administrimit</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Menaxhimi
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}

          <div className="pt-3">
            <p className="border-t border-slate-800 px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Terreni
            </p>
            <Link
              href="/zones"
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span>Pamja e punonjësit</span>
            </Link>
          </div>
        </nav>

        <div className="border-t border-slate-800 px-3 py-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-600/90 hover:text-white"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Dil</span>
            </button>
          </form>
        </div>
      </aside>

      <BottomNav items={NAV_ITEMS.slice(0, 5)} />
    </>
  )
}
