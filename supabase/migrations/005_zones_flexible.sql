-- Allow any zone code (not just Z1-Z4)
ALTER TABLE public.zones DROP CONSTRAINT IF EXISTS zones_code_check;

-- Add GPS/location fields to zones
ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS address   TEXT;

-- Create storage bucket for zone map images (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'zone-images',
  'zone-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read zone images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'zone-images');

CREATE POLICY "Authenticated upload zone images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'zone-images');

CREATE POLICY "Authenticated update zone images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'zone-images');

CREATE POLICY "Authenticated delete zone images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'zone-images');
