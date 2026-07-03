'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface BottomNavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface Props {
  items: BottomNavItem[]
}

/** Navigim i poshtëm mobil, i përbashkët për adminin dhe punonjësit. */
export default function BottomNav({ items }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-gray-600 active:bg-gray-100',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
