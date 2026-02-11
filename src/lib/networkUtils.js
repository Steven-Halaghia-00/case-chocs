
/**
 * Retries an async operation with exponential backoff
 * @param {Function} operation - The async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise<any>} - The result of the operation
 */
export const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's a client error (4xx), except 429 (Too Many Requests) or 408 (Request Timeout)
      // Supabase/PostgREST errors usually have a 'code' or 'status'
      const status = error?.status || error?.code;
      const isClientError = status >= 400 && status < 500;
      const isRetryable = status === 429 || status === 408 || status === 'PGRST116' || !isClientError; // PGRST116 is JSON object result expected
      
      if (i === maxRetries || !isRetryable) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, i) + (Math.random() * 100);
      console.warn(`Operation failed (Attempt ${i + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Formats a Supabase error into a user-friendly message
 * @param {Error} error - The error object
 * @returns {string} - User friendly message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Une erreur inconnue est survenue';
  
  if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
    return 'Erreur de connexion. Veuillez vérifier votre connexion internet.';
  }
  
  if (error.code === 'PGRST116') {
    return 'Données non trouvées ou format incorrect.';
  }
  
  if (error.code === '42702') { // Ambiguous column
     return 'Erreur de configuration de la base de données (colonne ambiguë).';
  }

  return error.message || 'Une erreur est survenue lors du traitement de la requête.';
};
