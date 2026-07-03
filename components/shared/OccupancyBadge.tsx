import { occupancyBadgeClass, occupancyLabel } from '@/lib/design/status'
import { cn } from '@/lib/utils/cn'

interface Props {
  /** Përqindja e zënies 0–100. */
  pct: number
  className?: string
}

/** Badge i nivelit të zënies (E lirë / Mesatare / E ngarkuar). */
export default function OccupancyBadge({ pct, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        occupancyBadgeClass(pct),
        className,
      )}
    >
      {occupancyLabel(pct)}
    </span>
  )
}
