-- ============================================================
-- ZONE ENTRY MARKER
-- Where the entry ("Hyrje") arrow is shown in the grid view:
--   'bottom' (default) | 'top' | 'none'
-- ============================================================

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS entry_position TEXT NOT NULL DEFAULT 'bottom';

ALTER TABLE public.zones DROP CONSTRAINT IF EXISTS zones_entry_position_check;
ALTER TABLE public.zones
  ADD CONSTRAINT zones_entry_position_check
  CHECK (entry_position IN ('top', 'bottom', 'none'));
