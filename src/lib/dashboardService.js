
import { supabase } from '@/lib/customSupabaseClient';
import { format, parseISO } from 'date-fns';

/**
 * Counts ALL tickets in the database without any status filters.
 * Returns the exact count of all records in petzi_tickets table.
 */
export async function getTotalTickets() {
  try {
    const { count, error } = await supabase
      .from('petzi_tickets')
      .select('*', { count: 'exact', head: true })
      .range(0, 49999);

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('getTotalTickets Error:', error);
    return 0;
  }
}

/**
 * Fetches global KPIs for the dashboard.
 * Aggregates data client-side for simplicity in this environment.
 * CRITICAL: Uses purchase_date (not received_at) for all time-based calculations.
 * Updated to fetch ALL tickets using count: 'exact' without payment_status filters.
 */
export async function getGlobalKPIs() {
  try {
    // 1. Fetch total tickets (ALL tickets, no filters)
    const totalTickets = await getTotalTickets();

    // 2. Fetch ticket data for revenue (we might still want to filter paid for revenue, but user asked for ticket count fix)
    // For revenue, we usually only count paid tickets. 
    // However, the prompt specifically focused on "TICKETS VENDUS" KPI count.
    // We will keep revenue logic separate (paid only) to be safe for financial data, 
    // unless implicitely requested otherwise.
    const { data: revenueTickets, error: revenueError } = await supabase
      .from('petzi_tickets')
      .select('price')
      .eq('payment_status', 'paid') 
      .range(0, 49999);

    if (revenueError) throw revenueError;

    // 3. Fetch active events (events with sessions in the future)
    const now = new Date().toISOString();
    const { data: futureSessions, error: sessionsError } = await supabase
      .from('petzi_sessions')
      .select('event_id')
      .gte('starts_at', now)
      .range(0, 4999);

    if (sessionsError) throw sessionsError;

    // 4. Fetch all sessions capacity for fill rate
    const { data: capacityData, error: capacityError } = await supabase
      .from('petzi_session_capacity')
      .select('capacity, booked_spots')
      .range(0, 9999);

    if (capacityError) throw capacityError;

    // --- Aggregations ---

    // Total Revenue (from paid tickets)
    const totalRevenue = revenueTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

    // Active Events (Unique event IDs from future sessions)
    const activeEventIds = new Set(futureSessions.map(s => s.event_id));
    const activeEventsCount = activeEventIds.size;

    // Total Sessions
    const totalSessions = capacityData.length;

    // Average Fill Rate
    let totalCapacity = 0;
    let totalBooked = 0;
    capacityData.forEach(c => {
      totalCapacity += (c.capacity || 0);
      totalBooked += (c.booked_spots || 0);
    });
    
    const averageFillRate = totalCapacity > 0 
      ? Math.round((totalBooked / totalCapacity) * 100) 
      : 0;

    // Top 3 Events (by revenue)
    // We need to fetch tickets with event_id for this
    const { data: allPaidTickets } = await supabase
      .from('petzi_tickets')
      .select('event_id, price')
      .eq('payment_status', 'paid')
      .range(0, 49999);
      
    const ticketCountsByEvent = {};
    const revenueByEvent = {};
    
    if (allPaidTickets) {
      allPaidTickets.forEach(t => {
        ticketCountsByEvent[t.event_id] = (ticketCountsByEvent[t.event_id] || 0) + 1;
        revenueByEvent[t.event_id] = (revenueByEvent[t.event_id] || 0) + (parseFloat(t.price) || 0);
      });
    }

    const topEventIds = Object.keys(ticketCountsByEvent)
      .sort((a, b) => ticketCountsByEvent[b] - ticketCountsByEvent[a])
      .slice(0, 3);

    let topEvents = [];
    if (topEventIds.length > 0) {
      const { data: eventDetails } = await supabase
        .from('petzi_events')
        .select('id, name')
        .in('id', topEventIds);

      if (eventDetails) {
        topEvents = eventDetails.map(e => ({
          id: e.id,
          name: e.name,
          tickets: ticketCountsByEvent[e.id] || 0,
          revenue: revenueByEvent[e.id] || 0
        })).sort((a, b) => b.tickets - a.tickets);
      }
    }

    return {
      totalTickets, // Corrected total count
      activeEvents: activeEventsCount,
      totalRevenue,
      totalSessions,
      averageFillRate,
      topEvents
    };

  } catch (error) {
    console.error('getGlobalKPIs Error:', error);
    return {
      totalTickets: 0,
      activeEvents: 0,
      totalRevenue: 0,
      totalSessions: 0,
      averageFillRate: 0,
      topEvents: []
    };
  }
}

/**
 * Fetches analysis data for specific events.
 */
export async function getEventAnalysis(eventIds) {
  if (!eventIds || eventIds.length === 0) return [];

  try {
    const { data: events, error: eventError } = await supabase
      .from('petzi_events')
      .select('id, name')
      .in('id', eventIds);
    
    if (eventError) throw eventError;

    const { data: tickets, error: ticketError } = await supabase
      .from('petzi_tickets')
      .select('event_id, price')
      .in('event_id', eventIds)
      .eq('payment_status', 'paid')
      .range(0, 49999);

    if (ticketError) throw ticketError;

    const { data: sessions, error: sessionError } = await supabase
      .from('petzi_sessions')
      .select(`
        id, 
        event_id,
        petzi_session_capacity (capacity, booked_spots)
      `)
      .in('event_id', eventIds)
      .range(0, 4999);

    if (sessionError) throw sessionError;

    const result = events.map(event => {
      const eventTickets = tickets.filter(t => t.event_id === event.id);
      const ticketCount = eventTickets.length;
      const revenue = eventTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

      const eventSessions = sessions.filter(s => s.event_id === event.id);
      const sessionCount = eventSessions.length;
      
      let totalCap = 0;
      let totalBooked = 0;
      
      eventSessions.forEach(s => {
        const cap = Array.isArray(s.petzi_session_capacity) 
          ? s.petzi_session_capacity[0] 
          : s.petzi_session_capacity;
        
        if (cap) {
          totalCap += (cap.capacity || 0);
          totalBooked += (cap.booked_spots || 0);
        }
      });

      const fillRate = totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0;

      return {
        eventId: event.id,
        eventName: event.name,
        sessions: sessionCount,
        tickets: ticketCount,
        revenue,
        fillRate
      };
    });

    return result;

  } catch (error) {
    console.error('getEventAnalysis Error:', error);
    return [];
  }
}

/**
 * Fetches CUMULATIVE sales trend data.
 */
export async function getSalesTrendData(eventIds) {
  if (!eventIds || eventIds.length === 0) return [];

  try {
    const { data: tickets, error } = await supabase
      .from('petzi_tickets')
      .select('event_id, purchase_date')
      .in('event_id', eventIds)
      .eq('payment_status', 'paid')
      .not('purchase_date', 'is', null)
      .order('purchase_date', { ascending: true })
      .range(0, 49999);

    if (error) throw error;

    if (!tickets || tickets.length === 0) return [];

    const dateSet = new Set();
    const ticketsByDate = {}; 

    tickets.forEach(t => {
      const dateKey = format(parseISO(t.purchase_date), 'yyyy-MM-dd');
      dateSet.add(dateKey);
      
      if (!ticketsByDate[dateKey]) {
        ticketsByDate[dateKey] = [];
      }
      ticketsByDate[dateKey].push(t);
    });

    const sortedDates = Array.from(dateSet).sort();
    const cumulativeCounts = {};
    eventIds.forEach(id => {
      cumulativeCounts[id] = 0;
    });

    const chartData = sortedDates.map(date => {
      const dailyTickets = ticketsByDate[date] || [];

      dailyTickets.forEach(t => {
        if (cumulativeCounts[t.event_id] !== undefined) {
          cumulativeCounts[t.event_id] += 1;
        }
      });

      const dataPoint = { date };
      eventIds.forEach(id => {
        dataPoint[id] = cumulativeCounts[id];
      });

      return dataPoint;
    });

    return chartData;

  } catch (error) {
    console.error('getSalesTrendData Error:', error);
    throw error;
  }
}

export async function getAllEventsForSelector() {
  try {
    const { data, error } = await supabase
      .from('petzi_events')
      .select('id, name')
      .order('name')
      .range(0, 4999);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('getAllEventsForSelector Error:', error);
    return [];
  }
}
