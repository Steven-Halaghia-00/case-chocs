
-- Migration: Fix duplicate sessions and add unique index
-- 1. Identifies duplicate sessions based on (event_id, starts_at, location_name, location_city)
-- 2. Consolidates tickets and capacity to the primary session (lowest ID)
-- 3. Deletes duplicate sessions
-- 4. Adds unique index to prevent future duplicates

DO $$
DECLARE
    r RECORD;
    keeper_id BIGINT;
    duplicate_ids BIGINT[];
BEGIN
    -- Loop through groups of duplicates
    FOR r IN 
        SELECT 
            event_id, 
            starts_at, 
            location_name, 
            location_city, 
            array_agg(id ORDER BY id ASC) as ids
        FROM 
            petzi_sessions
        GROUP BY 
            event_id, starts_at, location_name, location_city
        HAVING 
            count(*) > 1
    LOOP
        -- The first ID is the keeper (earliest created/lowest ID)
        keeper_id := r.ids[1];
        -- The rest are duplicates
        duplicate_ids := r.ids[2:array_length(r.ids, 1)];

        RAISE NOTICE 'Processing duplicates for event %, starts %, loc %, city %. Keeper: %, Duplicates: %', 
            r.event_id, r.starts_at, r.location_name, r.location_city, keeper_id, duplicate_ids;

        -- 1. Reassign Tickets to the keeper session
        UPDATE petzi_tickets
        SET session_id = keeper_id
        WHERE session_id = ANY(duplicate_ids);

        -- 2. Handle Capacity
        -- If keeper already has a capacity record, delete the duplicates' capacity records.
        -- If keeper does NOT have a capacity record, move one from duplicates to keeper.
        
        IF EXISTS (SELECT 1 FROM petzi_session_capacity WHERE session_id = keeper_id) THEN
            -- Keeper has capacity, just delete the duplicate capacities
            DELETE FROM petzi_session_capacity WHERE session_id = ANY(duplicate_ids);
        ELSE
            -- Keeper has no capacity. 
            -- Check if duplicates have capacity
            IF EXISTS (SELECT 1 FROM petzi_session_capacity WHERE session_id = ANY(duplicate_ids)) THEN
                -- Move the capacity from the first duplicate that has one
                UPDATE petzi_session_capacity
                SET session_id = keeper_id
                WHERE id = (
                    SELECT id FROM petzi_session_capacity 
                    WHERE session_id = ANY(duplicate_ids) 
                    LIMIT 1
                );
                
                -- Delete any remaining capacity records for duplicates
                DELETE FROM petzi_session_capacity WHERE session_id = ANY(duplicate_ids);
            END IF;
        END IF;

        -- 3. Delete duplicate sessions
        DELETE FROM petzi_sessions
        WHERE id = ANY(duplicate_ids);
        
    END LOOP;
END $$;

-- 4. Create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_petzi_sessions_unique_composite 
ON petzi_sessions (event_id, starts_at, location_name, location_city);
