import "server-only";

import type { CurrentUser } from "@hom/domain/auth";

import { getCurrentUser } from "@/lib/auth/current-user";

import { generateAiDemoSummary } from "./generate-ai-demo-summary";
import {
  AI_DEMO_UNAVAILABLE_MESSAGE,
  type AiDemoSummaryState,
} from "./ai-demo-types";

type SubmitAiDemoSummaryOptions = {
  loadCurrentUser?: () => Promise<CurrentUser | null>;
  generate?: () => Promise<AiDemoSummaryState>;
};

/**
 * Requires an authenticated user with an operational view permission before any
 * OpenRouter call. Never writes to the database. Any auth/permission failure returns
 * the safe unavailable state (no raw errors).
 */
export async function submitAiDemoSummary(
  options: SubmitAiDemoSummaryOptions = {},
): Promise<AiDemoSummaryState> {
  let user: CurrentUser | null;
  try {
    user = await (options.loadCurrentUser ?? getCurrentUser)();
  } catch {
    return { status: "unavailable", message: AI_DEMO_UNAVAILABLE_MESSAGE };
  }

  if (!user || !hasAiDemoAccess(user)) {
    return { status: "unavailable", message: AI_DEMO_UNAVAILABLE_MESSAGE };
  }

  return (options.generate ?? generateAiDemoSummary)();
}

function hasAiDemoAccess(user: CurrentUser): boolean {
  return user.permissions.some(
    (permission) =>
      permission === "can_view_appointments" ||
      permission === "can_view_payments",
  );
}
