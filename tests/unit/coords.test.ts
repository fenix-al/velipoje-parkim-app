import { describe, it, expect } from 'vitest'
import {
  dbToLeaflet,
  leafletToDb,
  polygonDbToLeaflet,
  polygonLeafletToDb,
  polygonCenter,
  type DbCoord,
  type LeafletCoord,
} from '@/lib/utils/coords'

describe('dbToLeaflet', () => {
  it('swaps x and y', () => {
    expect(dbToLeaflet([100, 200])).toEqual([200, 100])
  })

  it('handles zero values', () => {
    expect(dbToLeaflet([0, 0])).toEqual([0, 0])
  })

  it('handles large values', () => {
    expect(dbToLeaflet([1200, 800])).toEqual([800, 1200])
  })
})

describe('leafletToDb', () => {
  it('swaps y and x back', () => {
    expect(leafletToDb([200, 100])).toEqual([100, 200])
  })

  it('is the inverse of dbToLeaflet', () => {
    const original: DbCoord = [350, 120]
    expect(leafletToDb(dbToLeaflet(original))).toEqual(original)
  })
})

describe('polygonDbToLeaflet', () => {
  it('converts all coordinates', () => {
    const db: DbCoord[] = [
      [50, 100],
      [130, 100],
      [130, 150],
      [50, 150],
    ]
    const leaflet = polygonDbToLeaflet(db)
    expect(leaflet).toEqual([
      [100, 50],
      [100, 130],
      [150, 130],
      [150, 50],
    ])
  })

  it('handles empty array', () => {
    expect(polygonDbToLeaflet([])).toEqual([])
  })
})

describe('polygonLeafletToDb', () => {
  it('round-trips correctly', () => {
    const db: DbCoord[] = [[10, 20], [30, 40], [50, 60]]
    const roundTripped = polygonLeafletToDb(polygonDbToLeaflet(db))
    expect(roundTripped).toEqual(db)
  })
})

describe('polygonCenter', () => {
  it('computes center of a rectangle', () => {
    const coords: LeafletCoord[] = [
      [100, 50],
      [100, 130],
      [150, 130],
      [150, 50],
    ]
    const [cy, cx] = polygonCenter(coords)
    expect(cy).toBeCloseTo(125)
    expect(cx).toBeCloseTo(90)
  })

  it('returns [0, 0] for empty array', () => {
    expect(polygonCenter([])).toEqual([0, 0])
  })

  it('handles single point', () => {
    expect(polygonCenter([[42, 17]])).toEqual([42, 17])
  })
})
