
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useEventCapacity(eventId) {
  const [metrics, setMetrics] = useState({
    total_capacity: 0,
    total_tickets: 0,
    session_count: 0,
    fill_rate: 0,
    loading: true,
    error: null
  });

  const fetchEventMetrics = useCallback(async () => {
    if (!eventId) return;

    try {
      setMetrics(prev => ({ ...prev, loading: true }));

      // 1. Get Sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('petzi_sessions')
        .select('id, capacity')
        .eq('event_id', eventId);

      if (sessionError) throw sessionError;

      const sessionIds = sessions.map(s => s.id);
      const total_capacity = sessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const session_count = sessions.length;

      // 2. Count Tickets
      let total_tickets = 0;
      if (sessionIds.length > 0) {
        const { count, error: ticketError } = await supabase
          .from('petzi_tickets')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);

        if (ticketError) throw ticketError;
        total_tickets = count || 0;
      }

      const fill_rate = total_capacity > 0 
        ? Math.round((total_tickets / total_capacity) * 100) 
        : 0;

      setMetrics({
        total_capacity,
        total_tickets,
        session_count,
        fill_rate,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error(`Error fetching event capacity ${eventId}:`, err);
      setMetrics(prev => ({ ...prev, loading: false, error: err }));
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventMetrics();
    const channel = supabase
      .channel(`event-capacity-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_tickets' }, fetchEventMetrics)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchEventMetrics, eventId]);

  return metrics;
}
