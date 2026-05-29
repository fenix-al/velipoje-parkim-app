'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  History,
  Map,
  Edit3,
  Users,
  Settings,
  MapPin,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { signOut } from '@/lib/actions/auth'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/reports',   label: 'Raporte',      icon: FileText },
  { href: '/admin/history',   label: 'Historiku',    icon: History },
  { href: '/admin/zones',     label: 'Zonat',        icon: Map },
  { href: '/admin/map-editor',label: 'Harta',        icon: Edit3 },
  { href: '/admin/users',     label: 'Përdoruesit',  icon: Users },
  { href: '/admin/settings',  label: 'Cilësimet',    icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-16 md:w-56 min-h-screen bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-700">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
          🅿
        </div>
        <span className="hidden md:block text-sm font-semibold text-white truncate">
          Parkimi Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden md:block">{label}</span>
            </Link>
          )
        })}

        <div className="pt-2 border-t border-gray-700">
          <Link
            href="/zones"
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span className="hidden md:block">Harta (punonjës)</span>
          </Link>
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-gray-700">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="hidden md:block">Dil</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
