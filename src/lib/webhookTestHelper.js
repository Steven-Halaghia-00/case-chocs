

import { supabase } from '@/lib/customSupabaseClient';

export async function testWebhookFlow() {
  console.log("Starting webhook test...");
  
  const results = {
    success: false,
    initialCounts: {},
    finalCounts: {},
    differences: {},
    logs: [],
    error: null
  };

  const log = (msg) => {
    console.log(`[WebhookTest] ${msg}`);
    results.logs.push(msg);
  };

  try {
    // 1. Fetch initial counts
    log("Fetching initial database counts...");
    const tables = ['petzi_events', 'petzi_sessions', 'petzi_tickets', 'petzi_webhook_logs'];
    const initialCounts = {};

    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) throw error;
      initialCounts[table] = count || 0;
    }
    results.initialCounts = initialCounts;
    log(`Initial counts: ${JSON.stringify(initialCounts)}`);

    // 2. Trigger Webhook (Simulate by invoking the function directly)
    log("Triggering 'process-petzi-webhook' edge function with test payload...");
    
    // Generate a unique ticket number to ensure creation
    const uniqueId = Math.floor(Math.random() * 100000);
    const testPayload = {
      event: "ticket_created",
      details: {
        ticket: {
          number: `TEST-TKT-${uniqueId}`,
          eventId: "99999", // Test event ID
          title: "Test Event Integration",
          type: "regular",
          category: "General Admission",
          sessions: [
            {
              name: "Test Session 1",
              date: "2024-12-31",
              time: "20:00:00",
              doors: "19:00:00",
              location: {
                name: "Test Venue",
                street: "123 Test St",
                city: "Test City",
                postcode: "1000"
              }
            }
          ],
          price: {
            amount: "25.00",
            currency: "CHF"
          },
          promoter: "Test Promoter"
        },
        buyer: {
          firstName: "Test",
          lastName: "Buyer",
          role: "customer",
          postcode: "1000"
        }
      }
    };

    const { data: funcData, error: funcError } = await supabase.functions.invoke('process-petzi-webhook', {
      body: JSON.stringify(testPayload)
    });

    if (funcError) {
      log(`Edge function invocation failed: ${funcError.message}`);
      throw funcError;
    }
    log("Edge function executed successfully.");

    // 3. Wait for async processing
    log("Waiting 2 seconds for DB updates...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Fetch updated counts
    log("Fetching updated database counts...");
    const finalCounts = {};
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) throw error;
      finalCounts[table] = count || 0;
    }
    results.finalCounts = finalCounts;
    log(`Final counts: ${JSON.stringify(finalCounts)}`);

    // 5. Compare results
    const differences = {};
    let isSuccess = true;

    // Check sessions (should be +1)
    differences.petzi_sessions = finalCounts.petzi_sessions - initialCounts.petzi_sessions;
    if (differences.petzi_sessions < 1) isSuccess = false;

    // Check tickets (should be +1)
    differences.petzi_tickets = finalCounts.petzi_tickets - initialCounts.petzi_tickets;
    if (differences.petzi_tickets < 1) isSuccess = false;

    // Check logs (should be +1)
    differences.petzi_webhook_logs = finalCounts.petzi_webhook_logs - initialCounts.petzi_webhook_logs;
    if (differences.petzi_webhook_logs < 1) isSuccess = false;

    results.differences = differences;
    results.success = isSuccess;

    if (isSuccess) {
      log("SUCCESS: Database counts incremented as expected.");
    } else {
      log("FAILURE: Database counts did not increment correctly.");
      log(`Expected +1 for sessions/tickets/logs. Got: ${JSON.stringify(differences)}`);
    }

  } catch (err) {
    log(`ERROR: ${err.message}`);
    results.error = err.message;
    results.success = false;
  }

  return results;
}
