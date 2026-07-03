import { occupancyColor } from '@/lib/design/status'
import { cn } from '@/lib/utils/cn'

interface Props {
  /** Përqindja e zënies 0–100. */
  pct: number
  className?: string
  /** Shfaq rreshtin "Zënia — X%" sipër shiritit. */
  showLabel?: boolean
}

/** Shirit progresi i zënies me ngjyrë sipas pragjeve qendrore. */
export default function OccupancyBar({ pct, className, showLabel }: Props) {
  const clamped = Math.max(0, Math.min(100, pct))

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Zënia</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: occupancyColor(clamped) }}
        />
      </div>
    </div>
  )
}
