import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This client should only be used in server components or API routes
let adminClient: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  }

  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return adminClient;
}

export { getSupabaseAdmin };
