
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useSessionCapacity(sessionId) {
  const [metrics, setMetrics] = useState({
    capacity: 0,
    booked_spots: 0,
    available_spots: 0,
    fill_rate: 0,
    starts_at: null,
    location_name: '',
    capacity_mode: 'manual',
    loading: true,
    error: null
  });

  const fetchSessionMetrics = useCallback(async () => {
    if (!sessionId) return;

    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      // 1. Get Session Details
      const { data: sessionData, error: sessionError } = await supabase
        .from('petzi_sessions')
        .select('id, starts_at, location_name')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // 2. Get Capacity Data
      const { data: capacityData, error: capacityError } = await supabase
        .from('petzi_session_capacity')
        .select('capacity, booked_spots, available_spots, capacity_mode')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (capacityError && capacityError.code !== 'PGRST116') throw capacityError;

      const capacity = capacityData?.capacity || 0;
      const booked_spots = capacityData?.booked_spots || 0;
      const available_spots = capacityData?.available_spots || 0;
      const capacity_mode = capacityData?.capacity_mode || 'manual';
      
      let fill_rate = 0;
      if (capacity > 0) {
        fill_rate = Math.round((booked_spots / capacity) * 100);
      }

      setMetrics({
        capacity,
        booked_spots,
        available_spots,
        fill_rate,
        starts_at: sessionData.starts_at,
        location_name: sessionData.location_name,
        capacity_mode,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error(`Error fetching capacity for session ${sessionId}:`, err);
      setMetrics(prev => ({ ...prev, loading: false, error: err }));
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionMetrics();
    
    // Subscribe to changes in capacity table
    const capacitySub = supabase
      .channel(`capacity-update-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petzi_session_capacity', filter: `session_id=eq.${sessionId}` }, fetchSessionMetrics)
      .subscribe();

    return () => {
        supabase.removeChannel(capacitySub);
    };
  }, [fetchSessionMetrics, sessionId]);

  return metrics;
}
