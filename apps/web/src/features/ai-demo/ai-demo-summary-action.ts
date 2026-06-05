"use server";

import { submitAiDemoSummary } from "@/lib/ai/submit-ai-demo-summary";

import type { AiDemoSummaryState } from "@/lib/ai/ai-demo-types";

// Invoked via useActionState/<form action>; extra (state, formData) args are ignored.
export async function generateAiDemoSummaryAction(): Promise<AiDemoSummaryState> {
  return submitAiDemoSummary();
}
