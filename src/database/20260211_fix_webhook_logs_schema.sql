
-- Fix for webhook_logs table schema
-- 1. Drops existing webhook_logs table to ensure clean state
-- 2. Recreates table with correct columns requested by user
-- 3. Adds indexes and RLS policies

BEGIN;

-- Drop the table to ensure we start fresh with the correct schema
DROP TABLE IF EXISTS public.webhook_logs;

-- Create the table with the specific columns requested
CREATE TABLE public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT,
    message TEXT,
    error_message TEXT,
    payload JSONB,
    response JSONB,
    http_status INTEGER,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX idx_webhook_logs_created_at_desc ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);

-- RLS Policies
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service_role (Edge Functions) full access
CREATE POLICY "Service role full access" ON public.webhook_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users (Admins) to view logs
CREATE POLICY "Authenticated users view logs" ON public.webhook_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert logs
CREATE POLICY "Authenticated users insert logs" ON public.webhook_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMIT;
