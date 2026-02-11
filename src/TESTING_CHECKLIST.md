
# Verification Checklist for Supabase Integration

This document outlines the steps to verify that the application is correctly using real Supabase data and that all mock data has been removed.

## 1. Dashboard Page Verification
- [ ] **Load Dashboard**: Ensure dashboard loads without error.
- [ ] **Verify Real Data**: Check that `Tickets Sold`, `Revenue`, and `Active Events` cards display numbers matching the `petzi_tickets` table in Supabase (use Data Audit Panel to verify).
- [ ] **Event Selector**: Verify the dropdown list contains actual event names from `petzi_sessions`/`petzi_events`.
- [ ] **Selection Filter**: Select an event (e.g., "Test To Delete") and verify KPI cards update to show data ONLY for that event.
- [ ] **Real-time Update**:
    1. Open Dashboard in one window.
    2. Open a separate Supabase Table Editor or trigger a webhook.
    3. Insert a new ticket into `petzi_tickets`.
    4. Verify the Dashboard KPI numbers increment automatically within seconds.

## 2. Capacity & Occupancy Verification
- [ ] **Occupancy Calculation**:
    - Verify "Taux de Remplissage" on Dashboard matches (Total Tickets / Total Capacity * 100).
    - Verify the same percentage appears in "Gestion Capacité" tab of Tickets page.
- [ ] **Consistency**: Ensure both screens use the `calculateOccupancyPercentage` utility (checked via code review and consistent values).

## 3. Tickets Page Verification
- [ ] **List View**: Verify the table lists actual tickets from Supabase.
- [ ] **Search**: Test searching for a specific ticket number (e.g., a real one from DB).
- [ ] **Filtering**: Test filtering by Status and Category.
- [ ] **Pagination**: If >20 tickets exist, verify pagination works.

## 4. Webhook Integration Verification
- [ ] **Trigger Webhook**: Send a test payload to the Supabase Edge Function `petzi-webhook`.
- [ ] **Verify Storage**:
    - Check `petzi_webhook_calls` for the raw log.
    - Check `petzi_tickets` for the new ticket row.
    - Check `petzi_sessions` for any session updates.
- [ ] **UI Update**: Confirm the new ticket appears in Activity Feed and KPIs immediately.

## 5. Data Audit Panel
- [ ] **Open Panel**: Click "Data Audit" button (bottom left/right).
- [ ] **Check Counts**: Verify the displayed counts match your Supabase Dashboard row counts.
- [ ] **Inspect Raw Data**: View the JSON dump to confirm fields like `capacity`, `price`, `event_name` are populated correctly.

## 6. General System
- [ ] **No Mock Data**: Search codebase for `mockData`, `faker`, or hardcoded arrays in components. (Should be none).
- [ ] **Console Errors**: Open DevTools console. Ensure no red errors appear during navigation.
- [ ] **Dark Mode**: Toggle dark mode and verify charts/tables remain readable.

## Manual Test Script
1. Navigate to Dashboard. Note "Tickets Sold" count (e.g., 5).
2. Use Postman or Supabase SQL Editor to insert a dummy ticket:
   