
-- Task 1: Fix ambiguous column reference error (42702) in RPC function
-- Dropping and recreating with strict column qualification

BEGIN;

-- 1. Drop existing function to ensure clean slate
DROP FUNCTION IF EXISTS public.update_petzi_session_capacity(UUID, INTEGER);

-- 2. Recreate the function with fully qualified column names
CREATE OR REPLACE FUNCTION public.update_petzi_session_capacity(
  p_session_id UUID,
  p_capacity INTEGER
)
RETURNS TABLE (
  id UUID,
  event_id BIGINT,
  capacity INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'session_id cannot be null';
  END IF;
  
  IF p_capacity IS NULL OR p_capacity < 0 THEN
    RAISE EXCEPTION 'capacity must be a positive number';
  END IF;

  -- Update with explicit table qualification to avoid ambiguous column errors
  RETURN QUERY
  UPDATE public.petzi_sessions
  SET 
    capacity = p_capacity,
    updated_at = NOW()
  WHERE public.petzi_sessions.id = p_session_id
  RETURNING 
    public.petzi_sessions.id,
    public.petzi_sessions.event_id,
    public.petzi_sessions.capacity,
    public.petzi_sessions.updated_at;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO service_role;

COMMIT;
