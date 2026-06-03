import {
  createMockAuthBoundary,
  type AuthBoundary,
} from "@hom/domain/auth";

import { getAuthMode } from "@/lib/env/app-mode";

import { createSupabaseAuthBoundary } from "./supabase-auth-boundary";

export function getAuthBoundary(): AuthBoundary {
  const mode = getAuthMode();

  if (mode === "mock") {
    return createMockAuthBoundary();
  }

  return createSupabaseAuthBoundary();
}
