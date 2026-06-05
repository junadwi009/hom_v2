import "server-only";

import { z } from "zod";

const supabaseAdminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Server-only. The service-role key bypasses RLS and can create auth users, so it
// must never be exposed to the browser (no NEXT_PUBLIC_ prefix) or logged.
export function getSupabaseAdminEnv() {
  const parsed = supabaseAdminEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Supabase service-role environment is missing. Set SUPABASE_SERVICE_ROLE_KEY (server-only) to manage users.",
    );
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}
