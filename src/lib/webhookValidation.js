
import { isValid, parseISO } from 'date-fns';

/**
 * Validates a Petzi Webhook Payload for ticket creation.
 * Checks for required fields, data types, and format validity.
 * 
 * @param {Object} payload - The full webhook payload
 * @returns {Object} result - { valid: boolean, errors: string[] }
 */
export const validateWebhookPayload = (payload) => {
  const errors = [];

  // 1. Basic Structure
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload is missing or not an object'] };
  }

  if (!payload.event) {
    errors.push("Missing required field: 'event'");
  }

  if (!payload.details || typeof payload.details !== 'object') {
    errors.push("Missing required field: 'details' object");
    return { valid: false, errors }; // Stop here if details are missing
  }

  const { ticket } = payload.details;

  // 2. Ticket Details Validation
  if (!ticket) {
    errors.push("Missing required field: 'details.ticket'");
    return { valid: false, errors };
  }

  // Required Fields (DB Constraints)
  if (!ticket.eventId) errors.push("Missing required field: 'details.ticket.eventId'");
  if (!ticket.number) errors.push("Missing required field: 'details.ticket.number'");
  
  // Price validation
  if (!ticket.price) {
    errors.push("Missing required field: 'details.ticket.price'");
  } else {
    if (typeof ticket.price.amount === 'undefined') errors.push("Missing required field: 'details.ticket.price.amount'");
    if (!ticket.price.currency) errors.push("Missing required field: 'details.ticket.price.currency'");
  }

  // 3. Timestamp Validation
  if (ticket.generatedAt) {
    try {
      const date = parseISO(ticket.generatedAt);
      if (!isValid(date)) {
        errors.push(`Invalid date format for 'details.ticket.generatedAt': ${ticket.generatedAt}. Use ISO 8601.`);
      }
    } catch (e) {
      errors.push(`Date parsing error for 'details.ticket.generatedAt': ${e.message}`);
    }
  } else {
    // Ideally generatedAt should be present, but we can default it. Warn?
    // errors.push("Missing field: 'details.ticket.generatedAt'");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates the database schema requirements against a payload
 * Specifically checks for NOT NULL constraints known in the system.
 */
export const checkSchemaConstraints = (payload) => {
  const violations = [];
  const ticket = payload?.details?.ticket || {};

  // Based on petzi_tickets schema:
  // id (auto), ticket_number (NOT NULL), session_id (Nullable now), event_id (NOT NULL)
  
  if (!ticket.number) violations.push("NOT NULL violation: ticket_number");
  if (!ticket.eventId) violations.push("NOT NULL violation: event_id");
  // session_id is now nullable, so we don't strictly fail validation for it, 
  // but it's good practice to have it.

  return violations;
};
