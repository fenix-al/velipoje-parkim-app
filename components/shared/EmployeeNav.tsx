'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, User, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  profile: Profile
}

const ZONES = [
  { code: 'Z1', label: 'Zona 1' },
  { code: 'Z2', label: 'Zona 2' },
  { code: 'Z3', label: 'Zona 3' },
  { code: 'Z4', label: 'Zona 4' },
]

export default function EmployeeNav({ profile }: Props) {
  const pathname = usePathname()

  const initials = (profile.full_name ?? profile.email)
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Zone navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/zones"
            className="flex items-center gap-1 text-blue-600 font-semibold text-sm px-2 py-1 rounded hover:bg-blue-50 whitespace-nowrap"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Zonat</span>
          </Link>
          {ZONES.map((z) => {
            const href = `/zones/${z.code}`
            const active = pathname === href
            return (
              <Link
                key={z.code}
                href={href}
                className={cn(
                  'text-sm px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {z.code}
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.full_name ?? 'Punonjës'}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Profili im
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut}>
                <button type="submit" className="flex items-center gap-2 w-full text-red-600">
                  <LogOut className="h-4 w-4" />
                  Dil
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
