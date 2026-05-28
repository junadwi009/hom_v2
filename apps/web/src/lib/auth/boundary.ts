import {
  createMockAuthBoundary,
  type AuthBoundary,
} from "@hom/domain/auth";

import { getAuthMode } from "@/lib/env/app-mode";

export function getAuthBoundary(): AuthBoundary {
  const mode = getAuthMode();

  if (mode === "mock") {
    return createMockAuthBoundary();
  }

  throw new Error(
    "Supabase auth mode is planned but not enabled in this Phase 2 foundation.",
  );
}
