// src/lib/supabaseAdmin.js
// Admin client for server-side operations (bypasses RLS)

import { createClient } from '@supabase/supabase-js';

// This uses the service_role key which bypasses RLS
// ONLY use this in API routes, NEVER expose to client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // You need to add this to .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);