'use client'

import { cn } from '@/lib/utils/cn'

/**
 * Top-down car icon (car.png), rotated 90° so it lies horizontally inside
 * wide, short cells. The source image is a square portrait car.
 */
export function CarTopView({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/car.png"
      alt=""
      aria-hidden="true"
      className={cn('-rotate-90 object-contain select-none', className)}
      draggable={false}
    />
  )
}
