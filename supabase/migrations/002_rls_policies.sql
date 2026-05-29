-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_events    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'supervisor')
      AND is_active = true
  );
$$;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "profiles_read_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "profiles_read_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can update their own profile (only non-sensitive fields)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can insert/update/delete any profile
CREATE POLICY "profiles_admin_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- ZONES POLICIES
-- ============================================================

-- All authenticated users can read active zones
CREATE POLICY "zones_read_active"
  ON public.zones FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can read all zones (including inactive)
CREATE POLICY "zones_read_admin"
  ON public.zones FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admins can modify zones
CREATE POLICY "zones_admin_insert"
  ON public.zones FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "zones_admin_update"
  ON public.zones FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "zones_admin_delete"
  ON public.zones FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PARKING SPOTS POLICIES
-- ============================================================

-- All authenticated users can read active spots
CREATE POLICY "spots_read_active"
  ON public.parking_spots FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can read all spots
CREATE POLICY "spots_read_admin"
  ON public.parking_spots FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admins can directly modify spots (employees use RPCs)
CREATE POLICY "spots_admin_insert"
  ON public.parking_spots FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "spots_admin_update"
  ON public.parking_spots FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "spots_admin_delete"
  ON public.parking_spots FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PARKING SESSIONS POLICIES
-- ============================================================

-- All authenticated users can read sessions
CREATE POLICY "sessions_read_all"
  ON public.parking_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can directly modify sessions (others use RPCs)
CREATE POLICY "sessions_admin_insert"
  ON public.parking_sessions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "sessions_admin_update"
  ON public.parking_sessions FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "sessions_admin_delete"
  ON public.parking_sessions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- SPOT EVENTS POLICIES
-- ============================================================

-- All authenticated users can read events
CREATE POLICY "events_read_all"
  ON public.spot_events FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can directly modify events (others use RPCs)
CREATE POLICY "events_admin_insert"
  ON public.spot_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "events_admin_update"
  ON public.spot_events FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "events_admin_delete"
  ON public.spot_events FOR DELETE
  TO authenticated
  USING (public.is_admin());
