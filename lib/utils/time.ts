import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Europe/Tirane'

/**
 * Format a UTC ISO string for display in Europe/Tirane time.
 */
export function formatLocal(iso: string, fmt = 'dd/MM/yyyy HH:mm'): string {
  const zoned = toZonedTime(parseISO(iso), TZ)
  return format(zoned, fmt)
}

/**
 * Human-readable relative time (e.g. "3 minutes ago").
 */
export function fromNow(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

/**
 * Format duration in minutes to human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

/**
 * Return current date-time in Europe/Tirane as a Date object.
 */
export function nowInTirane(): Date {
  return toZonedTime(new Date(), TZ)
}

/**
 * ISO string for start of day in Europe/Tirane.
 */
export function startOfDayTirane(date: Date = new Date()): string {
  const zoned = toZonedTime(date, TZ)
  zoned.setHours(0, 0, 0, 0)
  return zoned.toISOString()
}
