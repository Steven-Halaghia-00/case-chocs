
-- Migration: Update petzi_sessions Schema
-- Links sessions strictly to events.

-- 1. Ensure columns
ALTER TABLE petzi_sessions
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES petzi_events(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS capacity INTEGER,
    ADD COLUMN IF NOT EXISTS capacity_mode TEXT DEFAULT 'auto',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Remove obsolete columns that might cause confusion
ALTER TABLE petzi_sessions DROP COLUMN IF EXISTS ticket_id;

-- 3. Create index for fast lookups by event
CREATE INDEX IF NOT EXISTS idx_petzi_sessions_event_id ON petzi_sessions(event_id);
