
import { format, isValid, addHours } from 'date-fns';
import { validateWebhookPayload } from './webhookValidation';

// Utility to ensure ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
const formatTimestamp = (dateInput) => {
  try {
    const date = dateInput ? new Date(dateInput) : new Date();
    if (!isValid(date)) {
      console.warn('[formatTimestamp] Invalid date provided, defaulting to now');
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (e) {
    console.error('[formatTimestamp] Error formatting date:', e);
    return new Date().toISOString();
  }
};

export const generateTicketNumber = (prefix = 'TKT') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generates a full Petzi webhook payload with support for optional session_id
 * @param {Object} ticketData - Configuration for the ticket
 * @param {Object} options - Additional options like sendIndex
 */
export const generateTicketPayload = (ticketData = {}, options = {}) => {
    const now = new Date();
    const index = options.sendIndex || 0;
    
    // Core Data
    const eventId = ticketData.eventId ? parseInt(ticketData.eventId, 10) : 10001;
    const ticketNum = ticketData.ticketNumber || generateTicketNumber('TEST');
    
    // Session Handling: strict null check to allow explicit null
    const sessionId = ticketData.sessionId === undefined ? null : ticketData.sessionId;

    // Date/Time Logic
    const sessionDate = ticketData.sessionDate || format(now, 'yyyy-MM-dd');
    const sessionTime = ticketData.sessionTime || "20:00";
    
    // Calculate starts_at/ends_at for metadata if needed
    // Note: In a real Petzi payload, these are usually implied by the session object
    const sessionStartIso = `${sessionDate}T${sessionTime}:00.000Z`;

    const payload = {
        event: "ticket_created",
        details: {
            ticket: {
                number: ticketNum,
                type: "online", 
                title: ticketData.eventTitle || "Test Event",
                category: ticketData.category || "Prélocation",
                eventId: eventId,
                sessions: [
                    {
                        id: sessionId, // Can be null or integer
                        name: "Session Standard",
                        date: sessionDate,
                        time: sessionTime,
                        location: {
                            name: "Case à Chocs",
                            city: "Neuchâtel"
                        }
                    }
                ],
                price: {
                    amount: ticketData.price || "25.00",
                    currency: ticketData.currency || "CHF"
                },
                cancellationReason: null,
                status: ticketData.paymentStatus || "paid",
                generatedAt: formatTimestamp(ticketData.purchaseDate || now),
                
                // Extra metadata fields requested
                metadata: ticketData.metadata || {},
                qr_code: null
            },
            buyer: {
                role: "customer",
                firstName: ticketData.firstName || "Jane",
                lastName: ticketData.lastName || "Doe",
                postcode: ticketData.postcode || "1000"
            }
        },
        timestamp: Date.now()
    };

    return payload;
};

// Legacy wrapper for backward compatibility with existing components
export const generateWebhookPayload = (formData, sendIndex = 0) => {
    return generateTicketPayload({
        ...formData,
        // Convert string inputs from forms to appropriate types if needed
        eventId: formData.eventId,
        sessionId: formData.sessionId ? parseInt(formData.sessionId, 10) : null
    }, { sendIndex });
};
