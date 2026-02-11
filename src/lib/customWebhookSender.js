
import { generateWebhookPayload } from './webhookPayloadGenerator';

/**
 * Tests the connectivity to Supabase and the Edge Function
 * @returns {Promise<{success: boolean, checks: Object, error?: string}>}
 */
export const testConnectivity = async () => {
  console.group('=== CONNECTIVITY TEST START ===');
  const results = {
    envVars: false,
    supabaseRest: false,
    edgeFunction: false
  };

  try {
    // 1. Check Environment Variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('[Connectivity] Checking Environment Variables...');
    if (supabaseUrl && anonKey) {
      console.log('✅ Environment Variables Present');
      results.envVars = true;
    } else {
      console.error('❌ Missing Environment Variables');
      console.groupEnd();
      return { success: false, checks: results, error: 'Variables d\'environnement manquantes (.env.local)' };
    }

    // 2. Test Supabase Reachability (REST API)
    // We try to fetch the root of the REST API or health check if available. 
    // Usually /rest/v1/ with a HEAD or OPTIONS request works to check if server is up.
    console.log('[Connectivity] Testing Supabase REST API Reachability...');
    try {
      const restUrl = `${supabaseUrl}/rest/v1/`;
      const restResponse = await fetch(restUrl, {
        method: 'HEAD',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      
      console.log(`[Connectivity] REST API Status: ${restResponse.status}`);
      if (restResponse.ok || restResponse.status === 404 || restResponse.status === 401) {
        // Even 404/401 means the server is reachable, just maybe no root route or auth issue
        console.log('✅ Supabase REST API is reachable');
        results.supabaseRest = true;
      } else {
        console.warn(`⚠️ Supabase REST API returned unexpected status: ${restResponse.status}`);
      }
    } catch (e) {
      console.error('❌ Supabase REST API Unreachable:', e);
    }

    // 3. Test Edge Function Reachability
    // We use OPTIONS to check for CORS headers and existence without triggering logic
    const functionUrl = `${supabaseUrl}/functions/v1/petzi-webhook`;
    console.log(`[Connectivity] Testing Edge Function Reachability: ${functionUrl}`);
    
    try {
      const funcResponse = await fetch(functionUrl, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${anonKey}`
        }
      });
      
      console.log(`[Connectivity] Edge Function Status: ${funcResponse.status}`);
      if (funcResponse.ok || funcResponse.status === 204 || funcResponse.status === 200) {
        console.log('✅ Edge Function is reachable');
        results.edgeFunction = true;
      } else {
        console.warn(`⚠️ Edge Function returned status: ${funcResponse.status}`);
        // If 500 or 404, it might be reachable but broken/missing
        if (funcResponse.status === 404 || funcResponse.status === 500) {
            results.edgeFunction = false; 
        }
      }
    } catch (e) {
      console.error('❌ Edge Function Unreachable:', e);
    }

    console.groupEnd();
    
    const allSuccess = results.envVars && results.supabaseRest && results.edgeFunction;
    return {
      success: allSuccess,
      checks: results,
      error: allSuccess ? null : 'Certaines vérifications de connectivité ont échoué.'
    };

  } catch (error) {
    console.error('CRITICAL CONNECTIVITY ERROR:', error);
    console.groupEnd();
    return {
      success: false,
      checks: results,
      error: error.message
    };
  }
};

/**
 * Sends a simulated webhook to the Edge Function with comprehensive logging
 * @param {Object} formData - Form data from CustomWebhookTestForm
 * @param {number} sendIndex - Index for batch sending
 */
export const sendCustomWebhook = async (formData, sendIndex = 0) => {
  console.group(`[WebhookSender] Starting Transaction #${sendIndex + 1}`);
  console.log(`[WebhookSender] Timestamp: ${new Date().toISOString()}`);
  
  try {
    // === SECTION 1: PRE-FLIGHT CHECK ===
    console.log('=== SECTION 1: PRE-FLIGHT CHECK ===');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
      if (!anonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
      
      const errorMessage = `Configuration manquante : Les variables d'environnement suivantes sont introuvables : ${missingVars.join(', ')}. Veuillez configurer votre fichier .env.local.`;
      
      console.error(`[WebhookSender] ❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Mask Key for logging
    const maskedKey = anonKey.length > 10 ? `${anonKey.substring(0, 5)}...${anonKey.substring(anonKey.length - 5)}` : '***';
    console.log(`[WebhookSender] Config: URL=${supabaseUrl}, Key=${maskedKey}`);

    // === SECTION 2: PAYLOAD GENERATION ===
    console.log('=== SECTION 2: PAYLOAD GENERATION ===');
    const payload = generateWebhookPayload(formData, sendIndex);
    console.log('[WebhookSender] Payload structure:', JSON.stringify(payload, null, 2));

    // === SECTION 3: NETWORK CONFIGURATION ===
    console.log('=== SECTION 3: NETWORK CONFIGURATION ===');
    const endpoint = `${supabaseUrl}/functions/v1/petzi-webhook`;
    console.log(`[WebhookSender] Target Endpoint: ${endpoint}`);

    // === SECTION 4: EXECUTION ===
    console.log('=== SECTION 4: EXECUTION ===');
    console.log('[WebhookSender] Sending Fetch Request...');
    console.time(`webhook-request-${sendIndex}`);
    
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      console.timeEnd(`webhook-request-${sendIndex}`);
      console.error('[WebhookSender] ❌ NETWORK ERROR');
      console.error('[WebhookSender] Error Type:', networkError.name);
      console.error('[WebhookSender] Error Message:', networkError.message);
      
      // Detailed CORS/Network error handling
      if (networkError.message === 'Failed to fetch' || networkError.name === 'TypeError') {
        const errorMsg = `
          Erreur de connexion (CORS ou Réseau).
          
          Veuillez vérifier les points suivants :
          1. L'URL Supabase est correcte dans .env.local
          2. La Edge Function "petzi-webhook" est déployée sur Supabase
          3. La clé Anon est valide
          4. Le serveur local tourne (npm run dev)
          
          Détails techniques: ${networkError.message}
        `;
        throw new Error(errorMsg);
      }
      throw networkError;
    }
    
    console.timeEnd(`webhook-request-${sendIndex}`);

    // === SECTION 5: RESPONSE PROCESSING ===
    console.log('=== SECTION 5: RESPONSE PROCESSING ===');
    console.log(`[WebhookSender] Status: ${response.status} ${response.statusText}`);
    
    // Log headers
    const headers = {};
    response.headers.forEach((value, key) => headers[key] = value);
    console.log('[WebhookSender] Response Headers:', headers);

    // Safe Response Parsing
    let result;
    let responseText = '';
    
    try {
      responseText = await response.text();
      console.log('[WebhookSender] Raw Response Body:', responseText);
      
      if (!responseText) {
        console.warn('[WebhookSender] ⚠️ Empty response body received');
        result = { message: 'Empty response' };
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           result = JSON.parse(responseText);
           console.log('[WebhookSender] Parsed JSON:', result);
        } else {
           result = { message: responseText };
           console.log('[WebhookSender] Treated as Text:', result);
        }
      }
    } catch (parseError) {
      console.error('[WebhookSender] ❌ Error parsing response:', parseError);
      result = { 
        message: 'Error parsing response', 
        raw: responseText, 
        error: parseError.message 
      };
    }

    if (!response.ok) {
      const errorMessage = result.error || result.message || response.statusText;
      console.error(`[WebhookSender] ❌ Server responded with error: ${errorMessage}`);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    console.log('[WebhookSender] ✅ Transaction Completed Successfully');
    console.groupEnd();

    return {
      success: true,
      status: response.status,
      data: result,
      payload: payload
    };

  } catch (error) {
    console.error('[WebhookSender] ❌ Transaction Failed');
    console.error('[WebhookSender] Error Type:', error.name);
    console.error('[WebhookSender] Error Message:', error.message);
    if (error.stack) console.error('[WebhookSender] Stack Trace:', error.stack);
    console.error('[WebhookSender] Full Error Object:', error);
    
    console.groupEnd();
    
    return {
      success: false,
      error: error.message,
      payload: null 
    };
  }
};
