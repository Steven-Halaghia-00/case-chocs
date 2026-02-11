
import { supabase } from '@/lib/customSupabaseClient';
import { parseISO, isAfter, endOfDay } from 'date-fns';

/**
 * Classifies a single event.
 * @param {string} eventId 
 */
export async function getEventStatus(eventId) {
  try {
    const { data: sessions, error } = await supabase
      .from('petzi_sessions')
      .select('starts_at')
      .eq('event_id', eventId)
      .order('starts_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return { lastSessionDate: null, isActive: false, status: 'no_sessions' };
    }

    const lastSessionDate = sessions[0].starts_at;
    const now = new Date();
    // Active if last session is in the future or today
    const isActive = isAfter(parseISO(lastSessionDate), new Date(now.setHours(0,0,0,0)));

    return {
      lastSessionDate,
      isActive,
      status: isActive ? 'active' : 'archived'
    };
  } catch (err) {
    console.error('Error getting event status:', err);
    return { lastSessionDate: null, isActive: false, status: 'error' };
  }
}

/**
 * Classifies a list of events into Active and Archived categories based on their last session date.
 * Fetches session data internally to ensure accuracy.
 */
export async function classifyAllEvents() {
  try {
    // Fetch all events with their sessions to determine J0 (last session)
    const { data: events, error } = await supabase
      .from('petzi_events')
      .select(`
        id,
        name,
        petzi_sessions (
          starts_at
        )
      `)
      .order('name');

    if (error) throw error;

    const classifiedEvents = events.map(event => {
      // Find last session date
      let lastSessionDate = null;
      if (event.petzi_sessions && event.petzi_sessions.length > 0) {
        // Sort to find the latest session
        const sortedSessions = event.petzi_sessions.sort((a, b) => 
          new Date(b.starts_at) - new Date(a.starts_at)
        );
        lastSessionDate = sortedSessions[0].starts_at;
      }

      // Determine active status
      let isActive = false;
      if (lastSessionDate) {
        const lastDate = parseISO(lastSessionDate);
        // Active if the last session hasn't passed "yesterday" (i.e., it's today or future)
        // We compare against start of today to include events happening today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        isActive = isAfter(endOfDay(lastDate), startOfToday);
      }

      return {
        id: event.id,
        name: event.name,
        lastSessionDate,
        isActive
      };
    });

    return {
      active: classifiedEvents.filter(e => e.isActive),
      archived: classifiedEvents.filter(e => !e.isActive)
    };

  } catch (err) {
    console.error('Error classifying all events:', err);
    return { active: [], archived: [] };
  }
}
