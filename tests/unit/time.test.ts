import { describe, it, expect } from 'vitest'
import { formatDuration } from '@/lib/utils/time'

describe('formatDuration', () => {
  it('shows "< 1 min" for very short durations', () => {
    expect(formatDuration(0)).toBe('< 1 min')
    expect(formatDuration(0.5)).toBe('< 1 min')
  })

  it('shows minutes for durations under an hour', () => {
    expect(formatDuration(1)).toBe('1 min')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(59)).toBe('59 min')
  })

  it('shows hours without minutes when minutes is 0', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('shows hours and minutes for mixed durations', () => {
    expect(formatDuration(90)).toBe('1h 30min')
    expect(formatDuration(125)).toBe('2h 5min')
  })
})
