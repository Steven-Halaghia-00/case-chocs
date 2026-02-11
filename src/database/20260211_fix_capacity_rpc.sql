
-- Task 1 & 6: Fix petzi_session_capacity RPC function
-- Renamed to update_petzi_session_capacity to avoid collision with table name
-- Task 2: Verify primary key on petzi_sessions

BEGIN;

-- 1. Verify/Add Primary Key to petzi_sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'petzi_sessions_pkey') THEN
        ALTER TABLE public.petzi_sessions ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 2. Drop existing function if it exists (to ensure clean slate)
DROP FUNCTION IF EXISTS public.petzi_session_capacity(uuid, integer);
DROP FUNCTION IF EXISTS public.update_petzi_session_capacity(uuid, integer);

-- 3. Create the RPC function
CREATE OR REPLACE FUNCTION public.update_petzi_session_capacity(p_session_id UUID, p_capacity INTEGER)
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

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_petzi_session_capacity(UUID, INTEGER) TO service_role;

COMMIT;
