-- Restrict service-state changes:
-- - only admins can mark/restore spots out of service
-- - a spot can be marked out of service only when it is free

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
  IF v_profile.role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Only admins can set spots out of service'
    );
  END IF;

  SELECT * INTO v_spot FROM public.parking_spots WHERE id = p_spot_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Parking spot not found');
  END IF;
  IF v_spot.current_status = 'out_of_service' THEN
    RETURN json_build_object('success', false, 'error', 'Spot is already out of service');
  END IF;
  IF v_spot.current_status != 'free' THEN
    RETURN json_build_object(
      'success',        false,
      'error',          'Spot must be free before it can be set out of service',
      'current_status', v_spot.current_status::text
    );
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
  IF v_profile.role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Only admins can restore spots'
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
