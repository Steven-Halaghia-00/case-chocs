
-- Migration: Update Petzi Schema and Add Logging
-- Implements robust schema for events, sessions, tickets, and logs.

-- 1. Update petzi_events
CREATE TABLE IF NOT EXISTS petzi_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE petzi_events 
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure unique name for lookups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'petzi_events_name_key') THEN
        ALTER TABLE petzi_events ADD CONSTRAINT petzi_events_name_key UNIQUE (name);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_petzi_events_name ON petzi_events(name);


-- 2. Update petzi_sessions
CREATE TABLE IF NOT EXISTS petzi_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE petzi_sessions
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES petzi_events(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS capacity INTEGER,
    ADD COLUMN IF NOT EXISTS capacity_mode TEXT DEFAULT 'auto';

CREATE INDEX IF NOT EXISTS idx_petzi_sessions_event_id ON petzi_sessions(event_id);


-- 3. Update petzi_tickets
CREATE TABLE IF NOT EXISTS petzi_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE petzi_tickets
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES petzi_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ticket_id TEXT, -- External ID from Petzi
    ADD COLUMN IF NOT EXISTS price NUMERIC,
    ADD COLUMN IF NOT EXISTS ticket_type TEXT,
    ADD COLUMN IF NOT EXISTS holder_name TEXT,
    ADD COLUMN IF NOT EXISTS holder_email TEXT,
    ADD COLUMN IF NOT EXISTS holder_phone TEXT,
    ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Ensure unique ticket_id for idempotency
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'petzi_tickets_ticket_id_key') THEN
        ALTER TABLE petzi_tickets ADD CONSTRAINT petzi_tickets_ticket_id_key UNIQUE (ticket_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_petzi_tickets_ticket_id ON petzi_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_petzi_tickets_session_id ON petzi_tickets(session_id);


-- 4. Update petzi_webhook_calls
CREATE TABLE IF NOT EXISTS petzi_webhook_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE petzi_webhook_calls
    ADD COLUMN IF NOT EXISTS webhook_type TEXT,
    ADD COLUMN IF NOT EXISTS event_name TEXT,
    ADD COLUMN IF NOT EXISTS ticket_id TEXT,
    ADD COLUMN IF NOT EXISTS payload JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_petzi_webhook_calls_created_at ON petzi_webhook_calls(created_at);


-- 5. Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    function_name TEXT,
    log_level TEXT,
    message TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp);
