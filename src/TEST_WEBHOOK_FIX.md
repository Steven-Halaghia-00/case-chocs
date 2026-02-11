
# Webhook Fix Verification Checklist

This document outlines the steps to verify the `process-petzi-webhook` Edge Function fix and the database schema updates.

## 1. Database Schema Verification
- [ ] **Run Migration**: Execute `src/database/20260212_fix_petzi_schema_identity.sql` in Supabase SQL Editor.
- [ ] **Verify `petzi_events`**:
    - Column `id` should be `bigint` (Primary Key).
- [ ] **Verify `petzi_sessions`**:
    - Column `id` should be `bigint generated always as identity`.
    - Column `event_id` should be `bigint` and FK to `petzi_events`.
- [ ] **Verify `petzi_tickets`**:
    - Column `id` should be `bigint generated always as identity`.
    - Column `session_id` should be `bigint` and FK to `petzi_sessions`.
    - Column `ticket_number` should be `text` and UNIQUE.

## 2. Edge Function Deployment
- [ ] **Deploy Function**: Deploy `process-petzi-webhook` using Supabase CLI or Dashboard.
- [ ] **Check Secrets**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

## 3. Functional Testing (Happy Path)
- [ ] **Trigger Webhook**: Send a valid payload (use `src/lib/webhookTestData.js` "NEW_EVENT_NEW_TICKET").
- [ ] **Check Response**: Should be 200 OK with JSON `{ success: true, eventId: ..., ticketId: ... }`.
- [ ] **Check Console Logs**:
    - "WEBHOOK RECEIVED"
    - "Validating payload..."
    - "Step 2: Processing Event..."
    - "Step 3: Creating Session..." -> "Session Created Successfully. ID: [number]"
    - "Step 5: Creating Ticket..." -> "Ticket Created Successfully. Internal ID: [number]"
    - "=== PROCESSING COMPLETE: SUCCESS ==="

## 4. Database Data Verification
- [ ] **`petzi_webhook_logs`**: New entry with status 'success'. Payload matches sent data.
- [ ] **`petzi_events`**: 1 new row. `id` matches payload. `name` matches payload.
- [ ] **`petzi_sessions`**: 1 new row. `event_id` matches event. `starts_at` is correct ISO timestamp.
- [ ] **`petzi_tickets`**: 1 new row. `ticket_number` matches payload. `session_id` is not NULL and matches session row.

## 5. Error Handling Tests
- [ ] **Test: Missing Ticket Data**: Send payload without `details.ticket`.
    - Expected: 500 Error. Log: "Invalid payload: Missing 'details.ticket'".
    - DB: Log entry with status 'error'.
- [ ] **Test: Missing Sessions**: Send payload with empty `sessions` array.
    - Expected: 500 Error. Log: "Invalid ticket data: 'sessions' array is missing or empty".
    - DB: Log entry with status 'error'.
- [ ] **Test: Invalid Date**: Send payload with "date": "invalid-date".
    - Expected: 500 Error. Log: "Invalid date/time format".
    - DB: Log entry with status 'error'.

## 6. End-to-End Test
- [ ] **Run `testWebhookFlow()`**: Use the Admin Dashboard "Test Flux Webhook" button (if implemented) or run the helper script.
- [ ] **Verify**: All counts increment by 1. Success message displayed.
