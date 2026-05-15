// Server-side Supabase client with service role key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Create clients with fallback (won't throw at module load)
// Errors will be caught when actually using the clients
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    })
  : null;

// Helper function to check if clients are initialized
export function checkSupabaseConfig() {
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY'
    );
  }
  if (!supabaseAdmin || !supabaseClient) {
    throw new Error('Failed to initialize Supabase clients');
  }
}
