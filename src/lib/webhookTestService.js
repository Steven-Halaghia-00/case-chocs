
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetches existing events to populate the test form
 */
export const getEventsForTest = async () => {
  try {
    const { data, error } = await supabase
      .from('petzi_events')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching events for test:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching events:', err);
    return [];
  }
};

/**
 * Fetches future sessions to populate the test form
 */
export const getSessionsForTest = async () => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('petzi_sessions')
      .select('id, event_id, starts_at, name')
      .gte('starts_at', now) // Only future sessions
      .order('starts_at');
      
    if (error) {
      console.error('Error fetching sessions for test:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching sessions:', err);
    return [];
  }
};
