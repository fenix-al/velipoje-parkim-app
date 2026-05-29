import type { CompletedSession } from '@/lib/supabase/types'
import { formatLocal, formatDuration } from './time'

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(values: unknown[]): string {
  return values.map(escapeCsv).join(',')
}

export function sessionsToCSV(sessions: CompletedSession[]): string {
  const header = row([
    'ID',
    'Zona',
    'Vend parkimi',
    'Zënë nga',
    'Zënë në',
    'Liruar nga',
    'Liruar në',
    'Kohëzgjatja',
    'Minuta',
  ])

  const dataRows = sessions.map((s) =>
    row([
      s.id,
      s.zone_code,
      s.spot_code,
      s.occupied_by_name,
      formatLocal(s.occupied_at),
      s.released_by_name ?? '',
      formatLocal(s.released_at),
      formatDuration(s.duration_minutes),
      s.duration_minutes,
    ])
  )

  return [header, ...dataRows].join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const bom = '﻿' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
