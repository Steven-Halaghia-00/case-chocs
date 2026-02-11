
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logDatabaseError } from '@/lib/databaseErrorHandler';

export function useCapacityMetrics() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Fetch sessions and their capacity field from petzi_sessions table
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('petzi_sessions')
        .select(`
          id,
          name,
          starts_at,
          event_id,
          capacity,
          petzi_events (
            name
          )
        `);

      if (sessionsError) throw sessionsError;

      // 2. Fetch all tickets to count reservations per session (bulk efficient)
      // Using head:false to get data, selecting only session_id to minimize transfer
      // Since we can't do GROUP BY in Supabase JS client easily for count, we fetch minimal data
      const { data: allTickets, error: ticketsError } = await supabase
        .from('petzi_tickets')
        .select('session_id')
        .range(0, 49999); // Ensure we get all tickets

      if (ticketsError) throw ticketsError;

      // Aggregate counts in memory
      const ticketCounts = {};
      allTickets.forEach(t => {
        ticketCounts[t.session_id] = (ticketCounts[t.session_id] || 0) + 1;
      });

      // 3. Map data
      const metrics = sessionsData.map(session => {
        const capacityTotal = session.capacity || 0;
        const reserved = ticketCounts[session.id] || 0;
        const available = Math.max(0, capacityTotal - reserved);
        
        // Calculate fill rate
        const fillRate = capacityTotal > 0 
            ? Math.round((reserved / capacityTotal) * 100) 
            : (reserved > 0 ? 100 : 0);

        return {
            id: session.id,
            name: session.name,
            starts_at: session.starts_at,
            event_name: session.petzi_events?.name || 'Unknown Event',
            event_id: session.event_id,
            capacity: capacityTotal,
            booked_spots: reserved,
            available_spots: available,
            fill_rate: fillRate
        };
      });

      setSessions(metrics);

    } catch (err) {
      console.error("Error in useCapacityMetrics:", err);
      setError(err);
      await logDatabaseError('useCapacityMetrics', 'error', 'Failed to fetch capacity metrics', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    const subscription = supabase
      .channel('capacity_metrics_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_sessions' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_tickets' }, () => fetchMetrics())
      .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, [fetchMetrics]);

  return { sessions, loading, error, refetch: fetchMetrics };
}
