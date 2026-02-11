
/**
 * Validates the structure of a Petzi webhook payload
 * @param {Object} payload - The generated payload object
 * @returns {boolean} - True if valid, throws error otherwise
 */
export const validatePayloadStructure = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object');
  }

  // 1. Root Level Validation
  if (!payload.event) throw new Error('Missing required field: payload.event');
  if (!payload.details) throw new Error('Missing required field: payload.details');

  const { details } = payload;

  // 2. Ticket Validation
  if (!details.ticket) throw new Error('Missing required field: payload.details.ticket');
  
  const requiredTicketFields = ['number', 'title', 'category', 'eventId', 'generatedAt'];
  for (const field of requiredTicketFields) {
    if (!details.ticket[field]) {
      throw new Error(`Missing required ticket field: ${field}`);
    }
  }

  // Price Validation
  if (!details.ticket.price) throw new Error('Missing ticket price object');
  if (typeof details.ticket.price.amount === 'undefined') throw new Error('Missing price amount');
  if (!details.ticket.price.currency) throw new Error('Missing price currency');

  // Sessions Array Validation
  if (!Array.isArray(details.ticket.sessions) || details.ticket.sessions.length === 0) {
    throw new Error('Ticket must have a non-empty "sessions" array');
  }

  // Validate each session in the array
  details.ticket.sessions.forEach((session, index) => {
    if (!session.name) throw new Error(`Session[${index}] missing name`);
    if (!session.date) throw new Error(`Session[${index}] missing date`);
    if (!session.time) throw new Error(`Session[${index}] missing time`);
    
    if (!session.location || !session.location.name) {
      throw new Error(`Session[${index}] missing location or location name`);
    }
  });

  // 3. Buyer Validation
  if (!details.buyer) throw new Error('Missing required field: payload.details.buyer');
  
  const requiredBuyerFields = ['firstName', 'lastName', 'role'];
  for (const field of requiredBuyerFields) {
    if (!details.buyer[field]) {
      throw new Error(`Missing required buyer field: ${field}`);
    }
  }

  return true;
};
