-- ============================================================
-- RPC: occupy_spot
-- All mutations go through RPCs to enforce business logic and
-- use database/server time (now()) — never client timestamps.
-- SELECT ... FOR UPDATE prevents race conditions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.occupy_spot(p_spot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_profile   profiles;
  v_spot      parking_spots;
  v_session   parking_sessions;
  v_now       TIMESTAMPTZ;
BEGIN
  v_now := now();

  -- Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Profile check
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  IF NOT v_profile.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Account is inactive');
  END IF;

  -- All roles (admin, supervisor, employee) may occupy spots
  -- Lock row to prevent double occupation
  SELECT * INTO v_spot
  FROM public.parking_spots
  WHERE id = p_spot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Parking spot not found');
  END IF;
  IF NOT v_spot.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Spot is not active');
  END IF;
  IF v_spot.current_status != 'free' THEN
    RETURN json_build_object(
      'success',        false,
      'error',          'Spot is not free',
      'current_status', v_spot.current_status::text
    );
  END IF;

  -- Create session
  INSERT INTO public.parking_sessions (spot_id, occupied_by, occupied_at)
  VALUES (p_spot_id, v_user_id, v_now)
  RETURNING * INTO v_session;

  -- Update spot status
  UPDATE public.parking_spots
  SET current_status = 'occupied', updated_at = v_now
  WHERE id = p_spot_id;

  -- Audit event
  INSERT INTO public.spot_events
    (spot_id, session_id, event_type, performed_by, performed_at)
  VALUES
    (p_spot_id, v_session.id, 'occupied', v_user_id, v_now);

  RETURN json_build_object(
    'success',      true,
    'spot_id',      p_spot_id,
    'spot_code',    v_spot.spot_code,
    'session_id',   v_session.id,
    'occupied_at',  v_now
  );
END;
$$;

-- ============================================================
-- RPC: release_spot
-- ============================================================

CREATE OR REPLACE FUNCTION public.release_spot(p_spot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id          UUID;
  v_profile          profiles;
  v_spot             parking_spots;
  v_session          parking_sessions;
  v_now              TIMESTAMPTZ;
  v_duration_minutes NUMERIC;
BEGIN
  v_now := now();

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND OR NOT v_profile.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found or inactive');
  END IF;

  -- Lock the spot row
  SELECT * INTO v_spot
  FROM public.parking_spots
  WHERE id = p_spot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Parking spot not found');
  END IF;
  IF v_spot.current_status = 'free' THEN
    RETURN json_build_object('success', false, 'error', 'Spot is already free');
  END IF;
  IF v_spot.current_status != 'occupied' THEN
    RETURN json_build_object(
      'success',        false,
      'error',          'Spot cannot be released from its current state',
      'current_status', v_spot.current_status::text
    );
  END IF;

  -- Find the active session
  SELECT * INTO v_session
  FROM public.parking_sessions
  WHERE spot_id = p_spot_id AND released_at IS NULL
  ORDER BY occupied_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No active session found for this spot');
  END IF;

  v_duration_minutes := ROUND(
    EXTRACT(EPOCH FROM (v_now - v_session.occupied_at)) / 60.0, 2
  );

  -- Close session
  UPDATE public.parking_sessions
  SET released_at = v_now, released_by = v_user_id
  WHERE id = v_session.id;

  -- Free the spot
  UPDATE public.parking_spots
  SET current_status = 'free', updated_at = v_now
  WHERE id = p_spot_id;

  -- Audit event with duration metadata
  INSERT INTO public.spot_events
    (spot_id, session_id, event_type, performed_by, performed_at, metadata)
  VALUES (
    p_spot_id,
    v_session.id,
    'released',
    v_user_id,
    v_now,
    json_build_object('duration_minutes', v_duration_minutes)
  );

  RETURN json_build_object(
    'success',           true,
    'spot_id',           p_spot_id,
    'spot_code',         v_spot.spot_code,
    'session_id',        v_session.id,
    'released_at',       v_now,
    'duration_minutes',  v_duration_minutes
  );
END;
$$;

-- ============================================================
-- RPC: set_spot_out_of_service
-- Only admins and supervisors may mark a spot out of service.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_spot_out_of_service(p_spot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile profiles;
  v_spot    parking_spots;
  v_now     TIMESTAMPTZ;
BEGIN
  v_now := now();

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND OR NOT v_profile.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found or inactive');
  END IF;
  IF v_profile.role NOT IN ('admin', 'supervisor') THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Only supervisors and admins can set spots out of service'
    );
  END IF;

  SELECT * INTO v_spot FROM public.parking_spots WHERE id = p_spot_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Parking spot not found');
  END IF;
  IF v_spot.current_status = 'out_of_service' THEN
    RETURN json_build_object('success', false, 'error', 'Spot is already out of service');
  END IF;

  UPDATE public.parking_spots
  SET current_status = 'out_of_service', updated_at = v_now
  WHERE id = p_spot_id;

  INSERT INTO public.spot_events
    (spot_id, event_type, performed_by, performed_at)
  VALUES
    (p_spot_id, 'out_of_service', v_user_id, v_now);

  RETURN json_build_object(
    'success',    true,
    'spot_id',    p_spot_id,
    'spot_code',  v_spot.spot_code
  );
END;
$$;

-- ============================================================
-- RPC: restore_spot
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_spot(p_spot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile profiles;
  v_spot    parking_spots;
  v_now     TIMESTAMPTZ;
BEGIN
  v_now := now();

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND OR NOT v_profile.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found or inactive');
  END IF;
  IF v_profile.role NOT IN ('admin', 'supervisor') THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Only supervisors and admins can restore spots'
    );
  END IF;

  SELECT * INTO v_spot FROM public.parking_spots WHERE id = p_spot_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Parking spot not found');
  END IF;
  IF v_spot.current_status != 'out_of_service' THEN
    RETURN json_build_object(
      'success',        false,
      'error',          'Spot is not out of service',
      'current_status', v_spot.current_status::text
    );
  END IF;

  UPDATE public.parking_spots
  SET current_status = 'free', updated_at = v_now
  WHERE id = p_spot_id;

  INSERT INTO public.spot_events
    (spot_id, event_type, performed_by, performed_at)
  VALUES
    (p_spot_id, 'restored', v_user_id, v_now);

  RETURN json_build_object(
    'success',   true,
    'spot_id',   p_spot_id,
    'spot_code', v_spot.spot_code
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.occupy_spot(UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_spot(UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_spot_out_of_service(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_spot(UUID)           TO authenticated;
