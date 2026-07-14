"use server";

import { submitKnowledgeQuery } from "@/lib/knowledge/server/submit-knowledge-query";
import type { KnowledgeQueryState } from "./knowledge-action-types";

export async function queryKnowledgeAction(
  _prev: KnowledgeQueryState,
  formData: FormData,
): Promise<KnowledgeQueryState> {
  return submitKnowledgeQuery(formData);
}
