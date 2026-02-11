
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Logs database queries and their results/errors for debugging and auditing.
 * 
 * @param {string} component - Name of the component initiating the query
 * @param {string} queryDesc - Description of what the query does
 * @param {object} context - Object containing table, filters, select string, etc.
 * @param {object} result - The { data, error } object returned by Supabase
 */
export async function logQuery(component, queryDesc, context, result) {
  const timestamp = new Date().toISOString();
  const status = result.error ? 'ERROR' : 'SUCCESS';
  
  const logEntry = {
    timestamp,
    component,
    query: queryDesc,
    context: JSON.stringify(context),
    status,
    recordCount: result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0,
    error: result.error ? result.error.message : null
  };

  // Console log for immediate development feedback
  console.group(`[Query] ${component}: ${queryDesc}`);
  console.log(`Status: ${status}`);
  console.log('Context:', context);
  if (result.data) console.log('Data (sample):', Array.isArray(result.data) ? result.data.slice(0, 3) : result.data);
  if (result.error) console.error('Error:', result.error);
  console.groupEnd();

  // Optionally persist critical query errors to webhook_logs for backend auditing
  if (result.error) {
    try {
      await supabase.from('webhook_logs').insert({
        timestamp,
        function_name: component,
        log_level: 'error',
        message: `Query Error in ${queryDesc}`,
        data: { context, error: result.error }
      });
    } catch (e) {
      console.error('Failed to log query error to DB:', e);
    }
  }
}
