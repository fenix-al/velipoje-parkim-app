'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface Props {
  /** Momenti i fillimit (ISO timestamp, p.sh. occupied_at i seancës). */
  since: string
  className?: string
  /** Pika pulsuese "live" para shifrave (default: true). */
  showPulse?: boolean
}

function pad(v: number) {
  return String(v).padStart(2, '0')
}

/** Kohëmatës live që rrjedh sekondë pas sekonde që nga `since`. */
export default function LiveDuration({ since, className, showPulse = true }: Props) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (now === null) {
    return <span className={cn('tabular-nums', className)}>--:--</span>
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const text = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`

  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}>
      {showPulse && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {text}
    </span>
  )
}
