
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetches all events, deduplicates them by ID, and returns clean data.
 */
export async function getAllEvents() {
  try {
    const { data, error } = await supabase
      .from('petzi_events')
      .select('id, name, promoter')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      throw error;
    }

    // Deduplicate by ID using a Map
    const uniqueEventsMap = new Map();
    if (data) {
      data.forEach(event => {
        if (!uniqueEventsMap.has(event.id)) {
            uniqueEventsMap.set(event.id, event);
        }
      });
    }

    return Array.from(uniqueEventsMap.values());
  } catch (error) {
    console.error('getAllEvents Exception:', error);
    return [];
  }
}
