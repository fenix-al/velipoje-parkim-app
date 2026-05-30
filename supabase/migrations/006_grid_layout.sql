-- ============================================================
-- GRID LAYOUT
-- Rows ("rreshta") of parking spots for the clean grid view.
-- Each zone has ordered rows; each row has ordered spots.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.zone_rows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     UUID        NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  position    INTEGER     NOT NULL DEFAULT 0,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_zone_rows_updated_at
  BEFORE UPDATE ON public.zone_rows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Spots can now belong to a grid row + ordered position.
-- polygon becomes optional (grid spots are positioned by row/position, not pixels).
ALTER TABLE public.parking_spots
  ADD COLUMN IF NOT EXISTS row_id   UUID REFERENCES public.zone_rows(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.parking_spots ALTER COLUMN polygon DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zone_rows_zone ON public.zone_rows(zone_id);
CREATE INDEX IF NOT EXISTS idx_spots_row      ON public.parking_spots(row_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.zone_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zone_rows_read_all"
  ON public.zone_rows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "zone_rows_admin_insert"
  ON public.zone_rows FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "zone_rows_admin_update"
  ON public.zone_rows FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "zone_rows_admin_delete"
  ON public.zone_rows FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- REALTIME
-- Add zone_rows + parking_spots to the realtime publication so the grid
-- reflects layout edits (rows/spots added or removed) live. Idempotent:
-- skip tables already in the publication.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'zone_rows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_rows;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'parking_spots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_spots;
  END IF;
END $$;

-- DELETE events only carry the primary key by default; that is enough here
-- (we just trigger a re-fetch), so no REPLICA IDENTITY change is needed.
