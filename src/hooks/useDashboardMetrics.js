
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    activeEvents: 0,
    activeSessions: 0,
    globalFillRate: 0,
    ticketsByEvent: [],
    capacityBySession: [],
    loading: true,
    error: null
  });

  async function fetchMetrics() {
    try {
      setMetrics(prev => ({ ...prev, loading: true }));
      const now = new Date().toISOString();

      // KPI 1: Total Tickets
      const { count: totalTickets } = await supabase
        .from('petzi_tickets')
        .select('*', { count: 'exact', head: true });

      // KPI 2 & 3: Active Events & Sessions
      const { data: activeSessions } = await supabase
        .from('petzi_sessions')
        .select('id, event_id, capacity')
        .gte('starts_at', now);
      
      const activeSessionsCount = activeSessions?.length || 0;
      const activeEventsCount = new Set(activeSessions?.map(s => s.event_id)).size || 0;

      // KPI 4: Global Fill Rate (Approximation based on limited capacity sessions)
      // Note: This query logic would ideally be a view or RPC in production
      const { data: sessionsWithCap } = await supabase
        .from('petzi_sessions')
        .select('id, capacity')
        .not('capacity', 'is', null);

      let totalCap = 0;
      let ticketsForCap = 0;

      if (sessionsWithCap && sessionsWithCap.length > 0) {
        totalCap = sessionsWithCap.reduce((sum, s) => sum + s.capacity, 0);
        const sessionIds = sessionsWithCap.map(s => s.id);
        
        // This query might be heavy if many sessions, limit for demo
        const { count } = await supabase
          .from('petzi_tickets')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);
          
        ticketsForCap = count || 0;
      }
      
      const globalFillRate = totalCap > 0 ? Math.round((ticketsForCap / totalCap) * 100) : 0;

      // Chart 1: Tickets by Event
      // Fetch tickets and aggregate in JS for simplicity (Supabase JS doesn't do GROUP BY easily without Views)
      const { data: ticketEvents } = await supabase
        .from('petzi_tickets')
        .select(`
          event_id,
          petzi_events (name)
        `)
        .limit(1000); // Limit sample size for frontend aggregation

      const eventCounts = {};
      ticketEvents?.forEach(t => {
        const name = t.petzi_events?.name || 'Unknown';
        eventCounts[name] = (eventCounts[name] || 0) + 1;
      });

      const ticketsByEvent = Object.entries(eventCounts)
        .map(([name, count]) => ({ name, ticket_count: count }))
        .sort((a, b) => b.ticket_count - a.ticket_count)
        .slice(0, 5);

      setMetrics({
        totalTickets: totalTickets || 0,
        activeEvents: activeEventsCount,
        activeSessions: activeSessionsCount,
        globalFillRate,
        ticketsByEvent,
        capacityBySession: [], // Placeholder, complicated query for frontend
        loading: false,
        error: null
      });

    } catch (err) {
      console.error("Dashboard metrics error:", err);
      setMetrics(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }

  useEffect(() => {
    fetchMetrics();
  }, []);

  return { ...metrics, refetch: fetchMetrics };
}
