
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Standardized error logging for database operations.
 * Logs directly to the 'webhook_logs' table in Supabase.
 * 
 * @param {string} functionName - Name of the function/component where error occurred
 * @param {string} level - 'info', 'warn', 'error'
 * @param {string} message - Human readable message
 * @param {object} data - Additional context/payload
 */
export async function logDatabaseError(functionName, level, message, data = {}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      function_name: functionName,
      log_level: level, // Maps the 'level' argument to the 'log_level' column
      message: message,
      data: data
    };

    console.log(`[${level.toUpperCase()}] ${functionName}: ${message}`, data);

    const { error } = await supabase.from('webhook_logs').insert(logEntry);
    
    if (error) {
      console.error('Failed to write to webhook_logs:', error);
    }
  } catch (e) {
    console.error('Critical failure in logDatabaseError:', e);
  }
}

export const handleError = async (error, context = '') => {
    await logDatabaseError(
        'Frontend Error Handler', 
        'error', 
        `Error in ${context}: ${error.message}`, 
        { error, stack: error.stack }
    );
    return error;
};
