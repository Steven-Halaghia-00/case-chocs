
# Database Cleanup & Integrity Testing Checklist

Use this checklist to verify that the database refactoring and cleanup have been successful.

## 1. Database Schema Verification
- [ ] **Drop Tables**: Verify `events`, `tickets`, `users` tables no longer exist in Supabase Table Editor.
- [ ] **petzi_events**: Verify columns `id`, `name`, `location`, `description` exist. Verify `name` is unique.
- [ ] **petzi_sessions**: Verify `event_id` column exists and is a Foreign Key to `petzi_events`.
- [ ] **petzi_tickets**: Verify `session_id` column exists and is a Foreign Key to `petzi_sessions`.

## 2. Webhook Integration Testing
- [ ] **New Event**: Send a webhook with a completely new event name.
    - [ ] Check `petzi_events`: Should have 1 new row with correct `name`.
    - [ ] Check `petzi_sessions`: Should have 1 new row linked to that event.
    - [ ] Check `petzi_tickets`: Should have 1 new row linked to that session.
- [ ] **Existing Event**: Send a webhook with an existing event name but new date.
    - [ ] Check `petzi_events`: Should NOT create a duplicate event row.
    - [ ] Check `petzi_sessions`: Should create a NEW session row for the new date.
    - [ ] Check `petzi_tickets`: Should be linked to the NEW session.
- [ ] **Existing Session**: Send a webhook for existing event and existing date.
    - [ ] Check `petzi_sessions`: Should NOT create a duplicate session.
    - [ ] Check `petzi_tickets`: Should be added to the existing session.

## 3. Frontend Component Verification
- [ ] **Event Selector**: Dropdown should display event names (not titles or IDs).
- [ ] **Dashboard Metrics**:
    - [ ] Select an event: Verify "Tickets Sold" matches database count for that event.
    - [ ] Verify "Occupancy" calculates correctly based on session capacity.
- [ ] **Capacity Management**:
    - [ ] Open a session card.
    - [ ] Toggle to "Manual Mode" and set a capacity.
    - [ ] Verify the value persists in `petzi_sessions` table.

## 4. Logs & Error Handling
- [ ] **Webhook Logs**: Check `webhook_logs` table.
    - [ ] Should see "event_found" or "event_created" entries.
    - [ ] Should see "session_found" or "session_created" entries.
- [ ] **Console Errors**: Open browser console on Dashboard. Verify no 404s or "column does not exist" errors.
