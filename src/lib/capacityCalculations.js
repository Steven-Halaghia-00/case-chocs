
/**
 * Shared utility functions for capacity calculations to ensure consistency across the application.
 */

/**
 * Calculates the occupancy percentage.
 * @param {number} ticketCount - The number of tickets sold.
 * @param {number} capacity - The total capacity.
 * @returns {string} - The percentage formatted to 2 decimal places (e.g., "45.00"). Returns "0.00" if capacity is 0 or invalid.
 */
export function calculateOccupancyPercentage(ticketCount, capacity) {
  if (!capacity || capacity <= 0) return "0.00";
  const percentage = (ticketCount / capacity) * 100;
  return Math.min(percentage, 100).toFixed(2); // Cap at 100% just in case of overbooking display logic, or keep raw? Usually nice to see >100. Let's not cap strictly for admin view, but user asked for standard formula.
  // Actually, standard formula doesn't imply capping.
  // But strict UI often prefers 0-100 bars. Let's return raw string fixed.
  return percentage.toFixed(2);
}

/**
 * Formats raw session data into a standardized object with occupancy metrics.
 * @param {Object} session - The raw session object (grouped).
 * @param {number} ticketCount - The calculated ticket count for this session.
 * @returns {Object} - Formatted session object.
 */
export function formatCapacityData(session, ticketCount) {
  const capacity = session.capacity || 0;
  const occupancyPercentage = calculateOccupancyPercentage(ticketCount, capacity);
  
  return {
    ...session,
    ticketsSold: ticketCount,
    occupancyPercentage: Number(occupancyPercentage),
    remaining: Math.max(0, capacity - ticketCount),
    status: capacity === 0 ? 'unknown' : (ticketCount >= capacity ? 'sold_out' : 'available')
  };
}
