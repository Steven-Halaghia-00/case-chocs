
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useActiveEvents() {
  const [events, setEvents] = useState([]);
  const [activeEventCount, setActiveEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchActiveEvents() {
      try {
        setLoading(true);
        const now = new Date().toISOString();

        // Fetch events that have future sessions
        const { data, error } = await supabase
          .from('petzi_events')
          .select(`
            id,
            name,
            promoter,
            petzi_sessions!inner (
              id,
              starts_at
            )
          `)
          .gte('petzi_sessions.starts_at', now)
          .order('name');

        if (error) throw error;

        // Process data to count active sessions per event
        const processedEvents = data.map(event => ({
          id: event.id,
          name: event.name,
          promoter: event.promoter,
          session_count: event.petzi_sessions.length
        }));

        // Remove duplicates if any (due to join logic) and sort
        const uniqueEvents = Array.from(new Map(processedEvents.map(item => [item.id, item])).values());
        
        setEvents(uniqueEvents);
        setActiveEventCount(uniqueEvents.length);

      } catch (err) {
        console.error("Error fetching active events:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveEvents();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  return { events, activeEventCount, loading, error };
}
