
import { supabase } from '@/lib/customSupabaseClient';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

/**
 * Fetches and calculates cumulative ticket sales relative to J0 (last session date) for selected events.
 * J0 = Date of the last session of the event.
 * Relative Day = purchase_date - J0 (e.g., -10 means bought 10 days before the event).
 */
export async function calculateRelativeDayData(eventIds) {
  if (!eventIds || eventIds.length === 0) return {};

  try {
    // 1. Get J0 (last session date) for each event
    // We need to fetch sessions again or assume they are passed. 
    // For robustness, we fetch the reference date J0 here.
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('petzi_sessions')
      .select('event_id, starts_at')
      .in('event_id', eventIds)
      .order('starts_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    // Map event_id -> J0 date string
    const eventJ0Map = {};
    sessionsData.forEach(session => {
      // Since we ordered by desc, the first one seen for an event is the last session
      if (!eventJ0Map[session.event_id]) {
        eventJ0Map[session.event_id] = session.starts_at;
      }
    });

    // 2. Fetch paid tickets for these events
    const { data: tickets, error: ticketsError } = await supabase
      .from('petzi_tickets')
      .select('event_id, purchase_date, payment_status')
      .in('event_id', eventIds)
      .eq('payment_status', 'paid')
      .not('purchase_date', 'is', null);

    if (ticketsError) throw ticketsError;

    // 3. Process data
    const eventCurves = {};

    eventIds.forEach(eventId => {
      const j0 = eventJ0Map[eventId] ? parseISO(eventJ0Map[eventId]) : null;
      if (!j0) return;

      const eventTickets = tickets.filter(t => t.event_id === eventId);
      
      // Group by relative day
      const dailyCounts = {};
      let minDay = 0; // usually negative

      eventTickets.forEach(t => {
        const purchaseDate = parseISO(t.purchase_date);
        // Diff: Purchase - J0. If bought before, it's negative.
        const diffDays = differenceInCalendarDays(purchaseDate, j0);
        
        // We only care about sales up to J0 (and maybe slightly after if data exists, but usually tracker stops at J0)
        // Let's allow positive days too (last minute sales)
        
        if (!dailyCounts[diffDays]) dailyCounts[diffDays] = 0;
        dailyCounts[diffDays]++;
        if (diffDays < minDay) minDay = diffDays;
      });

      // Calculate cumulative
      // We need a continuous range from minDay to maxDay
      const sortedDays = Object.keys(dailyCounts).map(Number).sort((a, b) => a - b);
      if (sortedDays.length === 0) return;

      const maxDay = Math.max(...sortedDays, 0); // At least go to J0
      const minDayActual = sortedDays[0];

      const cumulativePoints = [];
      let runningTotal = 0;

      // Fill gaps
      for (let day = minDayActual; day <= maxDay; day++) {
        const count = dailyCounts[day] || 0;
        runningTotal += count;
        cumulativePoints.push({
          relativeDay: day,
          count: runningTotal
        });
      }

      eventCurves[eventId] = cumulativePoints;
    });

    return eventCurves;

  } catch (error) {
    console.error('calculateRelativeDayData Error:', error);
    return {};
  }
}

/**
 * Merges separate event curves into a single dataset for Recharts.
 * Result: Array of { name: 'J-10', [eventId1]: 50, [eventId2]: 120 }
 */
export function mergeEventDataForChart(eventDataMap, selectedEvents) {
  if (!eventDataMap || Object.keys(eventDataMap).length === 0) return [];

  // Find global min and max relative days
  let globalMin = 0;
  let globalMax = 0;

  Object.values(eventDataMap).forEach(points => {
    if (points.length > 0) {
      const min = points[0].relativeDay;
      const max = points[points.length - 1].relativeDay;
      if (min < globalMin) globalMin = min;
      if (max > globalMax) globalMax = max;
    }
  });

  // Ensure we show at least up to J0
  if (globalMax < 0) globalMax = 0;

  // Build merged array
  const mergedData = [];

  for (let day = globalMin; day <= globalMax; day++) {
    const dataPoint = {
      dayIndex: day,
      name: day === 0 ? 'J0' : `J${day > 0 ? '+' : ''}${day}`, // Label for X Axis
    };

    // For each event, find the value at this day
    // Since cumulative, we need the value at 'day' OR the last known value if 'day' is later
    selectedEvents.forEach(eventId => {
      const points = eventDataMap[eventId];
      if (!points) return;

      // Find exact match
      const exactMatch = points.find(p => p.relativeDay === day);
      if (exactMatch) {
        dataPoint[eventId] = exactMatch.count;
      } else {
        // Find last known value
        // Filter points that are before or equal to current day
        const previousPoints = points.filter(p => p.relativeDay < day);
        if (previousPoints.length > 0) {
          // Take the last one (highest day index <= current day)
          dataPoint[eventId] = previousPoints[previousPoints.length - 1].count;
        } else {
          // Before any sales started
          dataPoint[eventId] = 0; // or null if we want to hide line start
        }
      }
    });

    mergedData.push(dataPoint);
  }

  return mergedData;
}
