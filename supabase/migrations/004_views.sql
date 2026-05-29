-- ============================================================
-- VIEW: v_current_occupancy_by_zone
-- Used by the admin dashboard for live occupancy cards.
-- ============================================================

CREATE OR REPLACE VIEW public.v_current_occupancy_by_zone AS
SELECT
  z.id                              AS zone_id,
  z.code                            AS zone_code,
  z.name                            AS zone_name,
  COUNT(ps.id)                      AS total_spots,
  COUNT(ps.id) FILTER (WHERE ps.current_status = 'occupied')         AS occupied_count,
  COUNT(ps.id) FILTER (WHERE ps.current_status = 'free')             AS free_count,
  COUNT(ps.id) FILTER (WHERE ps.current_status = 'out_of_service')   AS out_of_service_count,
  CASE
    WHEN COUNT(ps.id) FILTER (WHERE ps.current_status != 'out_of_service') > 0
    THEN ROUND(
      COUNT(ps.id) FILTER (WHERE ps.current_status = 'occupied')::NUMERIC /
      COUNT(ps.id) FILTER (WHERE ps.current_status != 'out_of_service') * 100,
      2
    )
    ELSE 0
  END                               AS occupancy_percentage
FROM public.zones z
LEFT JOIN public.parking_spots ps
  ON ps.zone_id = z.id AND ps.is_active = true
WHERE z.is_active = true
GROUP BY z.id, z.code, z.name
ORDER BY z.code;

-- ============================================================
-- VIEW: v_completed_sessions
-- Used for historical stats and reports.
-- ============================================================

CREATE OR REPLACE VIEW public.v_completed_sessions AS
SELECT
  sess.id,
  sess.spot_id,
  sp.spot_code,
  sp.zone_id,
  z.code                                                     AS zone_code,
  z.name                                                     AS zone_name,
  sess.occupied_by,
  occ.full_name                                              AS occupied_by_name,
  sess.occupied_at,
  sess.released_at,
  sess.released_by,
  rel.full_name                                              AS released_by_name,
  ROUND(
    EXTRACT(EPOCH FROM (sess.released_at - sess.occupied_at)) / 60.0,
    2
  )                                                          AS duration_minutes,
  -- Compute hour-of-day buckets in Europe/Tirane time
  EXTRACT(HOUR FROM (sess.occupied_at AT TIME ZONE 'Europe/Tirane'))::integer  AS arrival_hour,
  EXTRACT(HOUR FROM (sess.released_at AT TIME ZONE 'Europe/Tirane'))::integer  AS departure_hour
FROM public.parking_sessions sess
JOIN public.parking_spots sp   ON sp.id   = sess.spot_id
JOIN public.zones z            ON z.id    = sp.zone_id
JOIN public.profiles occ       ON occ.id  = sess.occupied_by
LEFT JOIN public.profiles rel  ON rel.id  = sess.released_by
WHERE sess.released_at IS NOT NULL;

-- ============================================================
-- VIEW: v_active_sessions
-- Used for the map page to show currently occupied spots.
-- ============================================================

CREATE OR REPLACE VIEW public.v_active_sessions AS
SELECT
  sess.id,
  sess.spot_id,
  sp.spot_code,
  sp.zone_id,
  z.code         AS zone_code,
  sess.occupied_by,
  pr.full_name   AS occupied_by_name,
  sess.occupied_at,
  ROUND(
    EXTRACT(EPOCH FROM (now() - sess.occupied_at)) / 60.0,
    2
  )              AS minutes_so_far
FROM public.parking_sessions sess
JOIN public.parking_spots sp ON sp.id  = sess.spot_id
JOIN public.zones z          ON z.id   = sp.zone_id
JOIN public.profiles pr      ON pr.id  = sess.occupied_by
WHERE sess.released_at IS NULL;

-- Grant read access to authenticated users
GRANT SELECT ON public.v_current_occupancy_by_zone TO authenticated;
GRANT SELECT ON public.v_completed_sessions        TO authenticated;
GRANT SELECT ON public.v_active_sessions           TO authenticated;
