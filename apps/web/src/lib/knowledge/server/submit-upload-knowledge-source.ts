import "server-only";

import { z } from "zod";

import { createKnowledgeSourceInputSchema } from "@hom/domain/knowledge";

import { getAuthMode, getDataMode } from "@/lib/env/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getGatewayMode } from "@/lib/ai/gateway";
import { extractByMime, SUPPORTED_MIME } from "@/lib/knowledge/extract";
import {
  rpcCreateSource,
  rpcFail,
  rpcSetExtracted,
  KnowledgeRpcError,
} from "./knowledge-rpcs";
import type { KnowledgeUploadState } from "@/features/knowledge-studio/knowledge-action-types";

const MAX_BYTES = 15 * 1024 * 1024;

const formSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    docType: z.string().trim().min(1).max(60),
    scopes: z.array(z.string()).min(1),
  })
  .strict();

/**
 * Orchestrates a single knowledge-source upload: mode gate, auth, RBAC, Zod
 * validation, storage upload (service-role admin client — the bucket has no
 * storage RLS policies for user-context clients), source-row creation,
 * text extraction, and recording the extracted text. Every branch returns a
 * discriminated KnowledgeUploadState instead of throwing, so the calling
 * server action can hand the result straight to useActionState.
 */
export async function submitUploadKnowledgeSource(
  formData: FormData,
): Promise<KnowledgeUploadState> {
  if (getDataMode() !== "supabase" || getAuthMode() !== "supabase") {
    return {
      status: "configuration_error",
      message: "Upload tidak tersedia di mode mock/preview.",
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
      message: "Anda tidak punya akses mengelola knowledge.",
    };
  }

  const file = formData.get("file");
  const scopesRaw = formData.getAll("scopes").map(String);

  let parsed: z.infer<typeof formSchema>;
  try {
    parsed = formSchema.parse({
      title: String(formData.get("title") ?? ""),
      docType: String(formData.get("docType") ?? ""),
      scopes: scopesRaw,
    });
    // Domain-level validation (scope enum, length limits) on top of the shape check.
    createKnowledgeSourceInputSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: "validation_error",
        message: "Periksa judul, tipe, dan scope.",
      };
    }
    throw error;
  }

  if (!(file instanceof File)) {
    return { status: "validation_error", message: "File wajib diunggah." };
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return {
      status: "validation_error",
      message: "Ukuran file 1 byte–15 MB.",
    };
  }
  if (!SUPPORTED_MIME.has(file.type)) {
    return { status: "unsupported_file", message: "Tipe file tidak didukung." };
  }

  const buffer = await file.arrayBuffer();
  const storagePath = `${user.id}/${Date.now()}-${file.name}`;

  // The knowledge-sources bucket is private with no storage RLS policies, so
  // only the service-role admin client can upload here — a user-context
  // client (createSupabaseServerClient) would be rejected by Storage.
  const admin = createSupabaseAdminClient();
  const upload = await admin.storage.from("knowledge-sources").upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) {
    return { status: "error", message: "Gagal menyimpan file." };
  }

  let sourceId = "";
  try {
    const created = await rpcCreateSource({
      title: parsed.title,
      docType: parsed.docType,
      scopes: parsed.scopes,
      storagePath,
      mimeType: file.type,
      fileSize: file.size,
      checksum: null,
    });
    sourceId = created.id;

    const { text, confidence } = await extractByMime({
      buffer,
      mimeType: file.type,
      fileName: file.name,
    });
    const extracted = await rpcSetExtracted({ id: sourceId, text, confidence });

    return {
      status: "success",
      sourceId,
      title: extracted.title,
      extractedText: extracted.extractedText ?? "",
      confidence: extracted.confidence ?? 0,
      mode: getGatewayMode(),
    };
  } catch (error) {
    if (sourceId) {
      try {
        await rpcFail({ id: sourceId, error: "extraction_failed" });
      } catch {
        // Best-effort only — do not let a secondary failure mask the original error.
      }
    }
    if (error instanceof KnowledgeRpcError && error.code === "PERMISSION_DENIED") {
      return {
        status: "permission_denied",
        message: "Akses ditolak oleh server.",
      };
    }
    return { status: "error", message: "Gagal memproses dokumen." };
  }
}
