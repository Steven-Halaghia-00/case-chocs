
-- Migration: 20260210_petzi_complete_schema
-- Description: Complete schema restructuring for Petzi integration with Events, Sessions, and Tickets

-- 1. Events Table
CREATE TABLE IF NOT EXISTS petzi_events (
    id INTEGER PRIMARY KEY, -- Petzi Event ID
    name TEXT NOT NULL,
    promoter TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS petzi_sessions (
    id SERIAL PRIMARY KEY, -- Internal ID, usually maps to Petzi Session ID if available, otherwise auto-increment
    event_id INTEGER REFERENCES petzi_events(id) ON DELETE CASCADE,
    name TEXT,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    doors_at TIMESTAMP WITH TIME ZONE,
    location_name TEXT,
    location_street TEXT,
    location_city TEXT,
    location_postcode TEXT,
    capacity INTEGER,
    capacity_mode TEXT DEFAULT 'limited', -- 'limited' or 'unlimited'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_petzi_sessions_event_id ON petzi_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_petzi_sessions_starts_at ON petzi_sessions(starts_at);

-- 3. Tickets Table
CREATE TABLE IF NOT EXISTS petzi_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Internal UUID
    ticket_id TEXT UNIQUE NOT NULL, -- Petzi Ticket Number (e.g. yIs1MRQRuyh1)
    session_id INTEGER REFERENCES petzi_sessions(id) ON DELETE SET NULL,
    event_id INTEGER, -- Denormalized for easier querying, or fetch via session
    ticket_type TEXT,
    title TEXT,
    category TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'CHF',
    holder_name TEXT,
    holder_email TEXT,
    holder_phone TEXT,
    holder_postcode TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE,
    payment_status TEXT, -- 'pending', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_petzi_tickets_ticket_id ON petzi_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_petzi_tickets_session_id ON petzi_tickets(session_id);

-- 4. Webhook Logs Table
CREATE TABLE IF NOT EXISTS petzi_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT,
    payload JSONB,
    status TEXT, -- 'success', 'error', 'pending'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
