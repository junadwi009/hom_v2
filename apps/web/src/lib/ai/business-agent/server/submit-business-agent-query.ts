import "server-only";

import { z } from "zod";

import {
  allowedKnowledgeScopes,
  businessAgentQueryInputSchema,
  evaluateKnowledgeAnswer,
} from "@hom/domain/knowledge";

import { answerFromContext, embedText, getGatewayMode } from "@/lib/ai/gateway";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { rpcMatch } from "@/lib/knowledge/server/knowledge-rpcs";

import type { BusinessAgentQueryState } from "@/features/ai-business-agent/business-agent-action-types";
import { recordAiInteraction } from "./record-ai-interaction";

/**
 * Read-only internal assistant query. Answers ONLY from the published knowledge
 * base, restricted to the scopes the asker is permitted to see, always passed
 * through the policy guard, and audited. Never mutates data or sends externally.
 */
export async function submitBusinessAgentQuery(
  formData: FormData,
): Promise<BusinessAgentQueryState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "AI Business Agent tidak tersedia di mode mock/preview.",
    };
  }

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Silakan login ulang." };
  }
  if (!user) {
    return { status: "auth_required", message: "Silakan login ulang." };
  }
  if (!user.permissions.includes("can_use_ai_business_agent")) {
    return { status: "permission_denied", message: "Anda tidak punya akses AI Business Agent." };
  }

  let input: z.infer<typeof businessAgentQueryInputSchema>;
  try {
    input = businessAgentQueryInputSchema.parse({ question: String(formData.get("question") ?? "") });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "validation_error", message: "Pertanyaan minimal 3 karakter." };
    }
    throw error;
  }

  try {
    const scopes = allowedKnowledgeScopes(user.permissions);
    const queryEmbedding = await embedText(input.question);
    const matches = await rpcMatch({ embedding: queryEmbedding, scopes, matchCount: 5 });
    const hasSources = matches.length > 0;
    const rawAnswer = hasSources
      ? await answerFromContext({ question: input.question, contexts: matches.map((m) => m.content) })
      : "";
    const guarded = evaluateKnowledgeAnswer({ answer: rawAnswer, hasSources });

    await recordAiInteraction({
      action: "ai.business_agent.answered",
      targetId: null,
      metadata: {
        sourceCount: matches.length,
        sourceIds: matches.map((m) => m.sourceId),
        scopes,
        policyFlags: guarded.policyFlags,
        mode: getGatewayMode(),
      },
    });

    return {
      status: "success",
      answer: guarded.answer,
      policyFlags: guarded.policyFlags,
      sources: matches.map((m) => ({ title: m.sourceTitle, snippet: m.content.slice(0, 200) })),
      mode: getGatewayMode(),
    };
  } catch {
    return { status: "error", message: "Gagal menjalankan AI Business Agent." };
  }
}
