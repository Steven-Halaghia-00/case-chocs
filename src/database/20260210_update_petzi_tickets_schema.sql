
-- Migration: Update petzi_tickets Schema
-- Links tickets strictly to sessions.

-- 1. Ensure columns
ALTER TABLE petzi_tickets
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES petzi_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS event_id UUID, -- Kept for historical reference/flexibility, but session_id is primary link
    ADD COLUMN IF NOT EXISTS ticket_number TEXT,
    ADD COLUMN IF NOT EXISTS event_name TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS price NUMERIC,
    ADD COLUMN IF NOT EXISTS currency TEXT,
    ADD COLUMN IF NOT EXISTS ticket_type TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS buyer JSONB,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Index for session lookups
CREATE INDEX IF NOT EXISTS idx_petzi_tickets_session_id ON petzi_tickets(session_id);
