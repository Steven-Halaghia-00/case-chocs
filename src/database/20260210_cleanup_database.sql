
-- Migration: Cleanup Obsolete Tables
-- Removes unused tables to prevent confusion with the official petzi_* tables.

-- Drop tables in order of dependency (child first, then parent)

-- Drop 'tickets' (was an old test table, replaced by petzi_tickets)
DROP TABLE IF EXISTS tickets CASCADE;

-- Drop 'events' (was an old test table, replaced by petzi_events)
DROP TABLE IF EXISTS events CASCADE;

-- Drop 'users' (custom user table, we rely on auth.users or a specific profiles table if needed later)
-- Note: Be careful if your app relies heavily on this. Based on instructions, we are removing it.
DROP TABLE IF EXISTS users CASCADE;

-- Confirm remaining tables exist (for verification purposes only, SQL doesn't output text)
-- Expected remaining: petzi_events, petzi_sessions, petzi_tickets, petzi_webhook_calls, webhook_logs
