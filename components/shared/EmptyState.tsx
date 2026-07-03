import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  /** Veprim opsional (p.sh. buton) nën përshkrim. */
  children?: React.ReactNode
  className?: string
}

/** Gjendje boshe standarde — ikonë, titull, përshkrim dhe veprim opsional. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-slate-100 p-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
