"use server";

import { submitPublishKnowledgeSource } from "@/lib/knowledge/server/submit-publish-knowledge-source";
import type { KnowledgePublishState } from "./knowledge-action-types";

export async function publishKnowledgeAction(
  _prev: KnowledgePublishState,
  formData: FormData,
): Promise<KnowledgePublishState> {
  return submitPublishKnowledgeSource(formData);
}
