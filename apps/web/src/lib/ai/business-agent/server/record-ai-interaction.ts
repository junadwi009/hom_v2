import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Best-effort audit; a logging failure must never fail the user's answer.
export async function recordAiInteraction(input: {
  action: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("record_ai_interaction", {
      p_action: input.action,
      p_target_id: input.targetId,
      p_metadata: input.metadata,
    });
  } catch {
    // swallow — never surface audit failures to the caller
  }
}
