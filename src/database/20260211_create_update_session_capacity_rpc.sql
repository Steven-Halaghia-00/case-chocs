
-- Drop function if exists (to recreate with correct parameters)
DROP FUNCTION IF EXISTS public.update_petzi_session_capacity(UUID, INTEGER) CASCADE;

-- Create function with correct parameter order: p_session_id FIRST, p_capacity SECOND
CREATE OR REPLACE FUNCTION public.update_petzi_session_capacity(
  p_session_id UUID,
  p_capacity INTEGER
)
RETURNS TABLE (
  id UUID,
  event_id BIGINT,
  capacity INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Validate inputs
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'session_id cannot be null';
  END IF;
  
  IF p_capacity IS NULL OR p_capacity < 0 THEN
    RAISE EXCEPTION 'capacity must be a positive number';
  END IF;
  
  -- Update session capacity
  RETURN QUERY
  UPDATE petzi_sessions
  SET 
    capacity = p_capacity,
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING 
    petzi_sessions.id,
    petzi_sessions.event_id,
    petzi_sessions.capacity,
    petzi_sessions.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO anon;

-- Verify function was created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'update_petzi_session_capacity';
