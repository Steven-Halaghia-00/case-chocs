
/**
 * Test Data Generator for Petzi Webhooks
 * Use these payloads to verify the webhook flow via Postman or manual fetch calls.
 */

const generateBasePayload = (idSuffix, eventName = "Soirée Disco 2026") => {
    return {
        event: "ticket_created",
        details: {
            status: "succeeded",
            purchasedAt: new Date().toISOString(),
            buyer: {
                firstName: "Jean",
                lastName: "Dupont",
                email: "jean.dupont@example.com"
            },
            ticket: {
                number: `TKT-${idSuffix}`,
                type: "early_bird",
                price: {
                    amount: 25.00,
                    currency: "CHF"
                },
                event: {
                    name: eventName,
                    location: "Case à Chocs, Neuchâtel",
                    capacity: 500
                },
                sessions: [
                    {
                        date: "2026-06-15",
                        time: "20:00:00",
                        name: "Main Event"
                    }
                ]
            }
        }
    };
};

export const TEST_SCENARIOS = {
    // Scenario 1: Completely new event, session, and ticket
    NEW_EVENT_NEW_TICKET: generateBasePayload(`NEW-${Date.now()}`, `New Festival ${Date.now()}`),

    // Scenario 2: Existing event, but new ticket
    // (Requires using an event name that already exists in DB)
    EXISTING_EVENT_NEW_TICKET: generateBasePayload(`EXIST-${Date.now()}`, "Soirée Disco 2026"),

    // Scenario 3: Duplicate ticket (Same ID)
    // Send this twice to test idempotency
    DUPLICATE_TICKET: {
        ...generateBasePayload("DUPE-TEST-123", "Soirée Duplicate"),
        // Hardcode ID to ensure it stays same across calls
        details: {
            ...generateBasePayload("DUPE-TEST-123").details,
            ticket: {
                ...generateBasePayload("DUPE-TEST-123").details.ticket,
                number: "DUPLICATE-ID-FIXED-999"
            }
        }
    }
};

export async function sendTestWebhook(scenarioKey) {
    const payload = TEST_SCENARIOS[scenarioKey];
    if (!payload) throw new Error("Invalid scenario key");

    console.log(`Sending webhook for scenario: ${scenarioKey}...`);
    
    try {
        // You would typically point this to your local Supabase function URL
        // e.g. http://127.0.0.1:54321/functions/v1/petzi-webhook
        const response = await fetch('http://127.0.0.1:54321/functions/v1/petzi-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log("Result:", result);
        return result;
    } catch (e) {
        console.error("Test failed:", e);
        throw e;
    }
}
