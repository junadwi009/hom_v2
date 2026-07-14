import "server-only";

import { z } from "zod";

import { chunkText, publishKnowledgeSourceInputSchema } from "@hom/domain/knowledge";

import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { embedTexts } from "@/lib/ai/gateway";
import { rpcPublish, KnowledgeRpcError } from "./knowledge-rpcs";
import type { KnowledgePublishState } from "@/features/knowledge-studio/knowledge-action-types";

const CHUNK_MAX_CHARS = 2000;
const CHUNK_OVERLAP = 200;

/**
 * Orchestrates publishing a reviewed knowledge source: mode gate, auth, RBAC
 * (can_publish_knowledge), Zod validation, chunking + embedding the edited
 * extracted text, and persisting chunks + status via the publish RPC. Every
 * branch returns a discriminated KnowledgePublishState instead of throwing,
 * so the calling server action can hand the result straight to
 * useActionState.
 */
export async function submitPublishKnowledgeSource(
  formData: FormData,
): Promise<KnowledgePublishState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Publish tidak tersedia di mode mock/preview.",
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
  if (!user.permissions.includes("can_publish_knowledge")) {
    return {
      status: "permission_denied",
      message: "Anda tidak punya akses publish knowledge.",
    };
  }

  let input: z.infer<typeof publishKnowledgeSourceInputSchema>;
  try {
    input = publishKnowledgeSourceInputSchema.parse({
      sourceId: String(formData.get("sourceId") ?? ""),
      extractedText: String(formData.get("extractedText") ?? ""),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "validation_error",
        message: "Teks atau ID tidak valid.",
      };
    }
    throw error;
  }

  const pieces = chunkText(input.extractedText, {
    maxChars: CHUNK_MAX_CHARS,
    overlap: CHUNK_OVERLAP,
  });
  if (pieces.length === 0) {
    return { status: "validation_error", message: "Tidak ada teks untuk di-embed." };
  }

  try {
    const embeddings = await embedTexts(pieces);
    const chunks = pieces.map((content, index) => ({
      index,
      content,
      embedding: embeddings[index],
      tokenCount: Math.ceil(content.length / 4),
    }));
    const published = await rpcPublish({
      id: input.sourceId,
      text: input.extractedText,
      chunks,
    });

    return {
      status: "success",
      sourceId: published.id,
      chunkCount: chunks.length,
    };
  } catch (error) {
    if (error instanceof KnowledgeRpcError && error.code === "PERMISSION_DENIED") {
      return {
        status: "permission_denied",
        message: "Akses ditolak oleh server.",
      };
    }
    return { status: "error", message: "Gagal mempublikasikan knowledge." };
  }
}
