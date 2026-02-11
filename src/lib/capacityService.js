
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Helper function to get correct session capacity metrics.
 * 1. Fetch capacity from petzi_sessions (or session_capacity).
 * 2. Count tickets for reserved count (from petzi_tickets).
 * 3. Calculate available.
 */
export async function getSessionCapacityInfo(sessionId) {
  try {
    // 1. Fetch session info including capacity
    // We try to get capacity from petzi_sessions table first as requested
    const { data: session, error: sessionError } = await supabase
      .from('petzi_sessions')
      .select('capacity')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // 2. Count actual tickets (reservations)
    const { count: ticketCount, error: ticketError } = await supabase
      .from('petzi_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (ticketError) throw ticketError;

    const capacityTotal = session?.capacity || 0;
    const reserved = ticketCount || 0;
    const available = Math.max(0, capacityTotal - reserved);

    return {
      capacityTotal,
      reserved,
      available
    };

  } catch (error) {
    console.error(`getSessionCapacityInfo Error for ${sessionId}:`, error);
    return {
      capacityTotal: 0,
      reserved: 0,
      available: 0
    };
  }
}

/**
 * Fetches events and counts their associated sessions.
 */
export async function getEventsWithSessionCount() {
  try {
    const { data: events, error: eventsError } = await supabase
      .from('petzi_events')
      .select('id, name, promoter')
      .order('name');

    if (eventsError) throw eventsError;

    const { data: sessions, error: sessionsError } = await supabase
      .from('petzi_sessions')
      .select('event_id');

    if (sessionsError) throw sessionsError;

    const counts = {};
    sessions.forEach(s => {
      counts[s.event_id] = (counts[s.event_id] || 0) + 1;
    });

    const uniqueEventsMap = new Map();
    events.forEach(event => {
      if (!uniqueEventsMap.has(event.id)) {
        uniqueEventsMap.set(event.id, {
          ...event,
          sessionCount: counts[event.id] || 0
        });
      }
    });

    const result = Array.from(uniqueEventsMap.values());
    
    return result.sort((a, b) => {
        if (a.sessionCount > 0 && b.sessionCount === 0) return -1;
        if (a.sessionCount === 0 && b.sessionCount > 0) return 1;
        return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error('getEventsWithSessionCount Error:', error);
    throw error;
  }
}

/**
 * Fetches sessions for a specific event and joins capacity data.
 */
export async function getSessionsForEvent(eventId) {
  try {
    const { data, error } = await supabase
      .from('petzi_sessions')
      .select(`
        *,
        petzi_session_capacity (*)
      `)
      .eq('event_id', eventId)
      .order('starts_at', { ascending: true });

    if (error) throw error;

    const uniqueSessionsMap = new Map();
    
    data.forEach(session => {
        const key = `${session.starts_at}-${session.location_name || ''}-${session.location_city || ''}`;
        
        if (!uniqueSessionsMap.has(key)) {
            const capacityData = Array.isArray(session.petzi_session_capacity) 
              ? session.petzi_session_capacity[0] 
              : session.petzi_session_capacity;
            
            uniqueSessionsMap.set(key, {
              ...session,
              capacity_data: capacityData || {
                capacity: 0,
                booked_spots: 0,
                available_spots: 0
              }
            });
        }
    });

    return Array.from(uniqueSessionsMap.values());
  } catch (error) {
    console.error(`getSessionsForEvent Error for ${eventId}:`, error);
    throw error;
  }
}

/**
 * Sets capacity for a session (Insert or Update).
 * Updated to use the RPC function.
 */
export async function updateSessionCapacity(sessionId, capacity) {
  try {
    // Ensure capacity is a valid positive integer
    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity < 0) {
      throw new Error('Capacity must be a positive number');
    }

    console.log(`[CapacityService] Calling RPC update_petzi_session_capacity`, {
        p_session_id: sessionId,
        p_capacity: numCapacity
    });

    // Call RPC function
    const { data, error } = await supabase.rpc('update_petzi_session_capacity', {
      p_session_id: sessionId,
      p_capacity: numCapacity
    });

    if (error) {
      console.error('[CapacityService] RPC update_petzi_session_capacity FAILED:', error);
      throw error;
    }

    console.log(`[CapacityService] RPC success:`, data);
    return data;
  } catch (error) {
    console.error(`[CapacityService] updateSessionCapacity Exception for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * @deprecated Use updateSessionCapacity instead
 */
export async function setSessionCapacity(sessionId, eventId, capacity) {
  return updateSessionCapacity(sessionId, capacity);
}

/**
 * Deprecated: Mode is no longer supported. This function now only updates capacity if provided.
 */
export async function setCapacityMode(sessionId, eventId, mode, capacityValue = null) {
    try {
        if (capacityValue !== null) {
            return await updateSessionCapacity(sessionId, capacityValue);
        }
        return null;
    } catch (error) {
        console.error(`setCapacityMode Error for ${sessionId}:`, error);
        throw error;
    }
}
