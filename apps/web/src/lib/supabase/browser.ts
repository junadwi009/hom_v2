"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/env/supabase";

export function createSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();

  return createBrowserClient(env.url, env.anonKey);
}
