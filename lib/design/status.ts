/**
 * Burimi i vetëm i së vërtetës për ngjyrat dhe etiketat e statusit të parkimit.
 *
 * Importohet si nga tailwind.config.ts (paleta `spot`) ashtu edhe nga
 * komponentët që kanë nevojë për ngjyra dinamike në inline styles
 * (progress bars, conic-gradient, grafikë).
 */

/** Ngjyrat bazë të statusit të një vendi parkimi. */
export const STATUS_COLORS = {
  free: '#16a34a', // green-600
  occupied: '#dc2626', // red-600
  warning: '#d97706', // amber-600
  out_of_service: '#6b7280', // gray-500
  pending: '#eab308', // yellow-500
} as const

/**
 * Paletë kategorike për grafikë (seri sipas zonave etj.).
 * Shmang të kuqen/jeshilen që janë të rezervuara për statusin zënë/lirë.
 */
export const CHART_CATEGORICAL = [
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#059669', // emerald-600
] as const

export type OccupancyLevel = 'low' | 'medium' | 'high'

/** Pragjet e zënies: >80% e ngarkuar, >50% mesatare, ndryshe e lirë. */
export function occupancyLevel(pct: number): OccupancyLevel {
  if (pct > 80) return 'high'
  if (pct > 50) return 'medium'
  return 'low'
}

const OCCUPANCY_META: Record<
  OccupancyLevel,
  { color: string; label: string; badgeClass: string }
> = {
  high: {
    color: STATUS_COLORS.occupied,
    label: 'E ngarkuar',
    badgeClass: 'bg-red-50 text-red-700',
  },
  medium: {
    color: STATUS_COLORS.warning,
    label: 'Mesatare',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  low: {
    color: STATUS_COLORS.free,
    label: 'E lirë',
    badgeClass: 'bg-green-50 text-green-700',
  },
}

/** Ngjyra hex sipas përqindjes së zënies — për inline styles/grafikë. */
export function occupancyColor(pct: number): string {
  return OCCUPANCY_META[occupancyLevel(pct)].color
}

/** Etiketa shqip e nivelit të zënies. */
export function occupancyLabel(pct: number): string {
  return OCCUPANCY_META[occupancyLevel(pct)].label
}

/** Klasat Tailwind për badge-in e nivelit të zënies. */
export function occupancyBadgeClass(pct: number): string {
  return OCCUPANCY_META[occupancyLevel(pct)].badgeClass
}
