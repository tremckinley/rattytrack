import { createClient } from '@supabase/supabase-js';

// Service role client for server-side operations that need to bypass RLS
// NEVER expose this client to the browser - it has admin privileges
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
