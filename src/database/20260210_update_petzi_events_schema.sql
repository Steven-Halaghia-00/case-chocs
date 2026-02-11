
-- Migration: Update petzi_events Schema
-- Standardizes the event structure.

-- 1. Rename 'title' to 'name' if it exists, or create 'name'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petzi_events' AND column_name = 'title') THEN
        ALTER TABLE petzi_events RENAME COLUMN title TO name;
    END IF;
END $$;

-- 2. Ensure columns exist
ALTER TABLE petzi_events 
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add constraint to ensure name is mandatory if not already
ALTER TABLE petzi_events ALTER COLUMN name SET NOT NULL;

-- 4. Create unique index on name for fast lookups and duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_petzi_events_name ON petzi_events(name);

-- 5. Clean up any unused columns if strictly necessary (optional, skipping safe side)
