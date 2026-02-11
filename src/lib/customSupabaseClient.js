import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oleitffazouxcfjrrbtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZWl0ZmZhem91eGNmanJyYnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDg0OTEsImV4cCI6MjA4NjIyNDQ5MX0.R6Ms7U9RkQPwxTPwQssKelaRVlNmt7kXzjYdbiywWNA';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
