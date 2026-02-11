
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Audits the webhook integration status.
 * Checks edge function availability, verifies endpoint validity,
 * and fetches recent logs to determine health.
 */
export async function auditWebhookIntegration() {
  const auditResults = {
    status: 'unknown', // 'healthy', 'degraded', 'error'
    endpointValid: false,
    functionCallable: false,
    recentLogs: [],
    errors: []
  };

  try {
    // 1. Check if Edge Function is callable (Ping)
    try {
        // We invoke the function with a ping payload or just a simple check
        // Assuming we can send a lightweight request to check availability
        const { data, error } = await supabase.functions.invoke('petzi-webhook', {
            body: { type: 'ping' }
        });
        
        if (!error) {
            auditResults.functionCallable = true;
        } else {
            auditResults.errors.push(`Edge Function Invoke Error: ${error.message}`);
        }
    } catch (e) {
        auditResults.errors.push(`Edge Function Exception: ${e.message}`);
    }

    // 2. Fetch Recent Webhook Logs
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('id, status, created_at, error_message')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      auditResults.errors.push(`Database Log Access Error: ${logsError.message}`);
      // If table doesn't exist, this is a critical configuration error
      if (logsError.code === '42P01') {
          auditResults.errors.push("CRITICAL: 'webhook_logs' table does not exist.");
      }
    } else {
      auditResults.recentLogs = logs || [];
    }

    // 3. Determine Health Status
    const hasRecentErrors = auditResults.recentLogs.some(l => l.status === 'error');
    const hasRecentSuccess = auditResults.recentLogs.some(l => l.status === 'success');

    if (auditResults.functionCallable && !hasRecentErrors) {
        auditResults.status = 'healthy';
        auditResults.endpointValid = true;
    } else if (auditResults.functionCallable && hasRecentErrors && hasRecentSuccess) {
        auditResults.status = 'degraded'; // Some errors, some success
        auditResults.endpointValid = true;
    } else if (!auditResults.functionCallable || (auditResults.recentLogs.length > 0 && !hasRecentSuccess)) {
        auditResults.status = 'error';
    } else {
        // Default healthy if no logs but function works (fresh install)
        auditResults.status = 'healthy';
        auditResults.endpointValid = true;
    }

    return auditResults;

  } catch (error) {
    console.error('auditWebhookIntegration failed:', error);
    return {
        ...auditResults,
        status: 'error',
        errors: [...auditResults.errors, error.message]
    };
  }
}
