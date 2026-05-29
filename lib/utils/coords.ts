/**
 * Coordinate conversion utilities for Leaflet CRS.Simple maps.
 *
 * Database stores polygon coordinates as image pixel [x, y].
 * Leaflet CRS.Simple expects [lat, lng] which maps to [y, x]
 * when using ImageOverlay with bounds [[0,0],[height,width]].
 */

export type DbCoord = [number, number]   // [x, y]
export type LeafletCoord = [number, number] // [y, x]

/**
 * Convert a single DB coordinate [x, y] to Leaflet [y, x].
 */
export function dbToLeaflet([x, y]: DbCoord): LeafletCoord {
  return [y, x]
}

/**
 * Convert an array of DB coordinates to Leaflet format.
 */
export function polygonDbToLeaflet(coords: DbCoord[]): LeafletCoord[] {
  return coords.map(dbToLeaflet)
}

/**
 * Convert a single Leaflet coordinate [y, x] back to DB [x, y].
 */
export function leafletToDb([y, x]: LeafletCoord): DbCoord {
  return [x, y]
}

/**
 * Convert an array of Leaflet coordinates back to DB format.
 */
export function polygonLeafletToDb(coords: LeafletCoord[]): DbCoord[] {
  return coords.map(leafletToDb)
}

/**
 * Compute the center of a polygon in Leaflet [y, x] format.
 */
export function polygonCenter(leafletCoords: LeafletCoord[]): LeafletCoord {
  const n = leafletCoords.length
  if (n === 0) return [0, 0]
  const sumY = leafletCoords.reduce((acc, [y]) => acc + y, 0)
  const sumX = leafletCoords.reduce((acc, [, x]) => acc + x, 0)
  return [sumY / n, sumX / n]
}
