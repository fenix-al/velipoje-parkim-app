import { describe, it, expect } from 'vitest'
import { sessionsToCSV } from '@/lib/utils/csv'
import type { CompletedSession } from '@/lib/supabase/types'

const MOCK_SESSIONS: CompletedSession[] = [
  {
    id: 'sess-1',
    spot_id: 'spot-1',
    spot_code: 'Z1-A01',
    zone_id: 'zone-1',
    zone_code: 'Z1',
    zone_name: 'Zona 1',
    occupied_by: 'user-1',
    occupied_by_name: 'Artan Hoxha',
    occupied_at: '2026-05-29T08:00:00.000Z',
    released_at: '2026-05-29T09:30:00.000Z',
    released_by: 'user-1',
    released_by_name: 'Artan Hoxha',
    duration_minutes: 90,
    arrival_hour: 10,
    departure_hour: 11,
  },
]

describe('sessionsToCSV', () => {
  it('includes a header row', () => {
    const csv = sessionsToCSV(MOCK_SESSIONS)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('Zona')
    expect(lines[0]).toContain('Vend parkimi')
  })

  it('includes spot code in data rows', () => {
    const csv = sessionsToCSV(MOCK_SESSIONS)
    expect(csv).toContain('Z1-A01')
  })

  it('includes zone code', () => {
    const csv = sessionsToCSV(MOCK_SESSIONS)
    expect(csv).toContain('Z1')
  })

  it('includes employee name', () => {
    const csv = sessionsToCSV(MOCK_SESSIONS)
    expect(csv).toContain('Artan Hoxha')
  })

  it('returns only header for empty sessions', () => {
    const csv = sessionsToCSV([])
    const lines = csv.split('\n').filter(Boolean)
    expect(lines).toHaveLength(1)
  })
})
