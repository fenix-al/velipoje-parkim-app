-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'employee');
CREATE TYPE public.spot_status AS ENUM ('free', 'occupied', 'out_of_service');
CREATE TYPE public.spot_event_type AS ENUM (
  'occupied',
  'released',
  'out_of_service',
  'restored',
  'manual_correction'
);

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        public.app_role NOT NULL DEFAULT 'employee',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ZONES
-- ============================================================

CREATE TABLE public.zones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT        NOT NULL UNIQUE,
  name             TEXT        NOT NULL,
  map_image_path   TEXT        NOT NULL,
  map_width        INTEGER     NOT NULL DEFAULT 1200,
  map_height       INTEGER     NOT NULL DEFAULT 800,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT zones_code_check CHECK (code IN ('Z1', 'Z2', 'Z3', 'Z4'))
);

-- ============================================================
-- PARKING SPOTS
-- ============================================================

CREATE TABLE public.parking_spots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id         UUID        NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  spot_code       TEXT        NOT NULL,
  -- Polygon stored as [[x,y],[x,y],...] in image pixel coordinates
  polygon         JSONB       NOT NULL,
  current_status  public.spot_status NOT NULL DEFAULT 'free',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(zone_id, spot_code)
);

-- ============================================================
-- PARKING SESSIONS
-- ============================================================

CREATE TABLE public.parking_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id      UUID        NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  occupied_by  UUID        NOT NULL REFERENCES public.profiles(id),
  occupied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at  TIMESTAMPTZ,
  released_by  UUID        REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SPOT EVENTS (AUDIT LOG)
-- ============================================================

CREATE TABLE public.spot_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id       UUID        NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  session_id    UUID        REFERENCES public.parking_sessions(id),
  event_type    public.spot_event_type NOT NULL,
  performed_by  UUID        NOT NULL REFERENCES public.profiles(id),
  performed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_parking_spots_updated_at
  BEFORE UPDATE ON public.parking_spots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.app_role,
      'employee'::public.app_role
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role        ON public.profiles(role);
CREATE INDEX idx_profiles_active      ON public.profiles(is_active);

CREATE INDEX idx_zones_code           ON public.zones(code);
CREATE INDEX idx_zones_active         ON public.zones(is_active);

CREATE INDEX idx_spots_zone_id        ON public.parking_spots(zone_id);
CREATE INDEX idx_spots_zone_status    ON public.parking_spots(zone_id, current_status);
CREATE INDEX idx_spots_active         ON public.parking_spots(is_active);

CREATE INDEX idx_sessions_spot_id     ON public.parking_sessions(spot_id);
CREATE INDEX idx_sessions_occupied_by ON public.parking_sessions(occupied_by);
CREATE INDEX idx_sessions_occupied_at ON public.parking_sessions(occupied_at);
CREATE INDEX idx_sessions_active      ON public.parking_sessions(spot_id)
  WHERE released_at IS NULL;
CREATE INDEX idx_sessions_released_at ON public.parking_sessions(released_at)
  WHERE released_at IS NOT NULL;

CREATE INDEX idx_events_spot_id       ON public.spot_events(spot_id);
CREATE INDEX idx_events_performed_at  ON public.spot_events(performed_at);
CREATE INDEX idx_events_type          ON public.spot_events(event_type);
CREATE INDEX idx_events_performed_by  ON public.spot_events(performed_by);
