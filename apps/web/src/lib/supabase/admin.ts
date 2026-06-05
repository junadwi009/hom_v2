import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env/supabase-admin";

// Service-role client. Use ONLY for Supabase Admin API calls (auth.admin.*).
// It bypasses RLS, so never hand it to client components or use it for ordinary
// reads/writes — those must go through the authenticated server client + RPCs.
export function createSupabaseAdminClient() {
  const env = getSupabaseAdminEnv();

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
