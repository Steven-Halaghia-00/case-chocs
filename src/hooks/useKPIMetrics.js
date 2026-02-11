
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { isValidUUID } from '@/lib/utils';
import { logDatabaseError } from '@/lib/databaseErrorHandler';
import { logQuery } from '@/lib/queryLogger';

export function useKPIMetrics(eventId = null, refreshTrigger = 0) {
  const [metrics, setMetrics] = useState({
    activeEventsCount: 0,
    occupancyPercentage: 0,
    ticketsSold: 0,
    totalRevenue: 0,
    debugLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    const logs = [];
    setLoading(true);
    setError(null);
    logs.push(`[${new Date().toISOString()}] Fetching KPIs. EventID: ${eventId || 'Global'}`);

    try {
      // --- 1. GLOBAL METRIC: Active Events Count ---
      // Task 5 & 3: Filter events with FUTURE sessions (starts_at >= NOW())
      // Query: JOIN petzi_events -> petzi_sessions
      const now = new Date().toISOString();
      const eventsQueryContext = { table: 'petzi_events', join: 'petzi_sessions', filter: 'starts_at >= NOW' };
      
      const { data: activeEventsData, error: activeError } = await supabase
        .from('petzi_events')
        .select('id, petzi_sessions!inner(starts_at)')
        .gte('petzi_sessions.starts_at', now);
        
      await logQuery('useKPIMetrics', 'Fetch Active Events', eventsQueryContext, { data: activeEventsData, error: activeError });

      if (activeError) throw activeError;
      
      // De-duplicate events (one event might have multiple future sessions)
      const uniqueActiveEvents = new Set(activeEventsData?.map(e => e.id));
      const activeEventsCount = uniqueActiveEvents.size;
      logs.push(`Active Events (Future): ${activeEventsCount}`);

      // --- 2. CONTEXT METRICS (Sessions & Tickets) ---
      let sessionsQuery = supabase.from('petzi_sessions').select('id, capacity, event_id');
      const sessionsContext = { table: 'petzi_sessions', select: 'id, capacity, event_id' };
      
      if (eventId) {
        if (!isValidUUID(eventId)) {
            throw new Error("Invalid UUID for Event ID");
        }
        sessionsQuery = sessionsQuery.eq('event_id', eventId);
        sessionsContext.filter = `event_id=${eventId}`;
      }

      const { data: sessions, error: sessionsError } = await sessionsQuery;
      await logQuery('useKPIMetrics', 'Fetch Sessions', sessionsContext, { data: sessions, error: sessionsError });
      
      if (sessionsError) throw sessionsError;
      
      const sessionIds = sessions?.map(s => s.id) || [];
      const totalCapacity = sessions?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0;

      // --- 3. Tickets & Revenue ---
      let ticketsQuery = supabase.from('petzi_tickets').select('id, price');
      const ticketsContext = { table: 'petzi_tickets', select: 'id, price' };

      if (eventId) {
        if (sessionIds.length > 0) {
            ticketsQuery = ticketsQuery.in('session_id', sessionIds);
            ticketsContext.filter = `session_id in [${sessionIds.length} ids]`;
        } else {
            ticketsQuery = null; // No sessions = No tickets
        }
      }

      let tickets = [];
      if (ticketsQuery) {
        const { data: tData, error: tError } = await ticketsQuery;
        await logQuery('useKPIMetrics', 'Fetch Tickets', ticketsContext, { data: tData, error: tError });
        
        if (tError) throw tError;
        tickets = tData || [];
      } else {
         // Global fetch if no eventId, or empty if event has no sessions
         if (!eventId) {
            const { data: allTickets, error: allTError } = await supabase.from('petzi_tickets').select('id, price');
            await logQuery('useKPIMetrics', 'Fetch All Tickets (Global)', {}, { data: allTickets, error: allTError });
            if (allTError) throw allTError;
            tickets = allTickets || [];
         }
      }

      const ticketsSold = tickets.length;
      const totalRevenue = tickets.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

      // --- 4. Occupancy ---
      let occupancyPercentage = 0;
      if (totalCapacity > 0) {
        occupancyPercentage = (ticketsSold / totalCapacity) * 100;
      }

      setMetrics({
        activeEventsCount,
        occupancyPercentage: Number(occupancyPercentage.toFixed(2)),
        ticketsSold,
        totalRevenue,
        debugLogs: logs
      });

    } catch (err) {
      console.error("KPI Fetch Error:", err);
      setError(err);
      await logDatabaseError('useKPIMetrics', 'error', 'Failed to fetch KPI metrics', { error: err.message, eventId });
    } finally {
      setLoading(false);
    }
  }, [eventId, refreshTrigger]);

  useEffect(() => {
    fetchMetrics();
    
    const channels = [
        supabase.channel('kpi_evts').on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_events' }, fetchMetrics).subscribe(),
        supabase.channel('kpi_sess').on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_sessions' }, fetchMetrics).subscribe(),
        supabase.channel('kpi_tkts').on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_tickets' }, fetchMetrics).subscribe()
    ];

    return () => {
        channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchMetrics]);

  return { ...metrics, loading, error, refetch: fetchMetrics };
}
