
-- Migration: Restructure Session and Capacity Management
-- Description: Standardizes petzi_sessions and petzi_tickets for session-based capacity tracking.
-- Author: Hostinger Horizons
-- Date: 2026-02-10

BEGIN;

-- 1. ALTER petzi_sessions
-- Ensure base columns and constraints exist
ALTER TABLE IF EXISTS petzi_sessions 
    ADD COLUMN IF NOT EXISTS event_id INTEGER,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS doors_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS location_name TEXT,
    ADD COLUMN IF NOT EXISTS location_street TEXT,
    ADD COLUMN IF NOT EXISTS location_city TEXT,
    ADD COLUMN IF NOT EXISTS location_postcode TEXT,
    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS capacity_mode TEXT DEFAULT 'auto', -- 'auto' (petzi) or 'manual'
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add Foreign Key to events if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'petzi_sessions_event_id_fkey') THEN
        ALTER TABLE petzi_sessions 
        ADD CONSTRAINT petzi_sessions_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES petzi_events(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. ALTER petzi_tickets
-- Link tickets to specific sessions instead of just events
ALTER TABLE IF EXISTS petzi_tickets 
    ADD COLUMN IF NOT EXISTS session_id INTEGER,
    ADD COLUMN IF NOT EXISTS ticket_id TEXT, -- Original Petzi Ticket ID
    ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'succeeded',
    ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS holder_phone TEXT;

-- Ensure ticket_id is unique if it's the main identifier
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'petzi_tickets_ticket_id_key') THEN
        ALTER TABLE petzi_tickets ADD CONSTRAINT petzi_tickets_ticket_id_key UNIQUE (ticket_id);
    END IF;
END $$;

-- Add Foreign Key to sessions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'petzi_tickets_session_id_fkey') THEN
        ALTER TABLE petzi_tickets 
        ADD CONSTRAINT petzi_tickets_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES petzi_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_petzi_sessions_event_id ON petzi_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_petzi_sessions_starts_at ON petzi_sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_petzi_tickets_session_id ON petzi_tickets(session_id);
CREATE INDEX IF NOT EXISTS idx_petzi_tickets_event_id ON petzi_tickets(event_id);

COMMIT;
