# Map Images

Place the actual aerial/map images for each zone here:

- `zona-1.jpg` — Zona 1 (must match `map_width` and `map_height` in the `zones` table)
- `zona-2.jpg` — Zona 2
- `zona-3.jpg` — Zona 3
- `zona-4.jpg` — Zona 4

## Requirements

- Format: JPEG (preferred for aerial photos) or PNG
- Default expected size: 1200 × 800 px (or update the `map_width`/`map_height` columns in the database)
- The parking spot polygon coordinates in `parking_spots.polygon` are in pixel coordinates `[x, y]` relative to this image

## Coordinate System

The map uses Leaflet `CRS.Simple` with `ImageOverlay` and bounds `[[0, 0], [mapHeight, mapWidth]]`.

When drawing parking spots:
- DB format: `[[x, y], [x, y], ...]` (pixel coordinates, origin at top-left)
- Leaflet format: `[[y, x], [y, x], ...]` (y is the "latitude" in CRS.Simple)

This conversion is handled automatically by `lib/utils/coords.ts`.
