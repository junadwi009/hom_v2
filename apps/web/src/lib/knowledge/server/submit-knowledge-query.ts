import "server-only";

import { z } from "zod";

import { evaluateKnowledgeAnswer, knowledgeQueryInputSchema } from "@hom/domain/knowledge";

import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerFromContext, embedText, getGatewayMode } from "@/lib/ai/gateway";
import { rpcMatch } from "./knowledge-rpcs";
import type { KnowledgeQueryState } from "@/features/knowledge-studio/knowledge-action-types";

/**
 * Orchestrates the Test Lab query flow: mode gate, auth, RBAC
 * (can_manage_knowledge), Zod validation, embedding the question, retrieving
 * scope-filtered chunks via the match RPC, generating a grounded answer
 * through the AI gateway, and running the policy guard before returning the
 * answer + cited sources. Every branch returns a discriminated
 * KnowledgeQueryState instead of throwing, so the calling server action can
 * hand the result straight to useActionState.
 */
export async function submitKnowledgeQuery(
  formData: FormData,
): Promise<KnowledgeQueryState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Test Lab tidak tersedia di mode mock/preview.",
    };
  }

  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return { status: "auth_required", message: "Silakan login ulang." };
  }
  if (!user) {
    return { status: "auth_required", message: "Silakan login ulang." };
  }
  if (!user.permissions.includes("can_manage_knowledge")) {
    return {
      status: "permission_denied",
      message: "Anda tidak punya akses knowledge.",
    };
  }

  let input: z.infer<typeof knowledgeQueryInputSchema>;
  try {
    input = knowledgeQueryInputSchema.parse({
      question: String(formData.get("question") ?? ""),
      scope: String(formData.get("scope") ?? ""),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "validation_error",
        message: "Pertanyaan minimal 3 karakter dan scope wajib.",
      };
    }
    throw error;
  }

  try {
    const queryEmbedding = await embedText(input.question);
    const matches = await rpcMatch({
      embedding: queryEmbedding,
      scopes: [input.scope],
      matchCount: 5,
    });
    const hasSources = matches.length > 0;
    const rawAnswer = hasSources
      ? await answerFromContext({
          question: input.question,
          contexts: matches.map((match) => match.content),
        })
      : "";
    const guarded = evaluateKnowledgeAnswer({ answer: rawAnswer, hasSources });

    return {
      status: "success",
      answer: guarded.answer,
      policyFlags: guarded.policyFlags,
      sources: matches.map((match) => ({
        title: match.sourceTitle,
        snippet: match.content.slice(0, 200),
      })),
      mode: getGatewayMode(),
    };
  } catch {
    return { status: "error", message: "Gagal menjalankan Test Lab." };
  }
}
