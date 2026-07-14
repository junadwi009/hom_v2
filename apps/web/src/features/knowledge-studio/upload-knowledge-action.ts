"use server";

import { submitUploadKnowledgeSource } from "@/lib/knowledge/server/submit-upload-knowledge-source";

import type { KnowledgeUploadState } from "./knowledge-action-types";

export async function uploadKnowledgeAction(
  _prev: KnowledgeUploadState,
  formData: FormData,
): Promise<KnowledgeUploadState> {
  return submitUploadKnowledgeSource(formData);
}
