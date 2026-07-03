import { Info, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

const TONES = {
  blue: { text: 'text-blue-700', bg: 'bg-blue-50' },
  green: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
  amber: { text: 'text-amber-700', bg: 'bg-amber-50' },
  red: { text: 'text-red-700', bg: 'bg-red-50' },
  violet: { text: 'text-violet-700', bg: 'bg-violet-50' },
  gray: { text: 'text-gray-700', bg: 'bg-gray-100' },
} as const

export type StatTone = keyof typeof TONES

interface Props {
  title: string
  value: React.ReactNode
  /** Shënim i vogël nën vlerë, p.sh. "për periudhën". */
  note?: string
  /** Shpjegim i shfaqur si tooltip te ikona e informacionit. */
  info?: string
  icon: LucideIcon
  tone?: StatTone
  className?: string
}

/** Kartë statistike e ripërdorshme — titull, vlerë, shënim dhe ikonë me ton ngjyre. */
export default function StatCard({
  title,
  value,
  note,
  info,
  icon: Icon,
  tone = 'blue',
  className,
}: Props) {
  const colors = TONES[tone]

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                {title}
              </p>
              {info && (
                <span
                  title={info}
                  aria-label={info}
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400"
                >
                  <Info className="h-3 w-3" />
                </span>
              )}
            </div>
            <p className={cn('mt-1 truncate text-xl font-bold leading-none sm:text-2xl', colors.text)}>
              {value}
            </p>
            {note && (
              <p className="mt-1.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                {note}
              </p>
            )}
          </div>
          <div className={cn('shrink-0 rounded-full p-2 sm:p-2.5', colors.bg)}>
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', colors.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
