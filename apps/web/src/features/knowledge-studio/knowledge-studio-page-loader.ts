import { getDataMode } from "@/lib/env/app-mode";
import { createKnowledgeRepositories } from "@/lib/knowledge/repository-factory";

import {
  toKnowledgeSourceRow,
  type KnowledgeStudioPageState,
} from "./knowledge-studio-page-state";

export async function loadKnowledgeStudioPage(
  canManage: boolean,
): Promise<KnowledgeStudioPageState> {
  const source = getDataMode() === "supabase" ? "supabase" : "mock";

  if (!canManage) return { status: "permission_denied", source };

  try {
    const { knowledge } = await createKnowledgeRepositories();
    const result = await knowledge.list();

    if (result.total === 0) return { status: "empty", source };

    return {
      status: "ready",
      source,
      sources: result.items.map(toKnowledgeSourceRow),
    };
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "42501") return { status: "permission_denied", source };
    return { status: "error", source, message: "Gagal memuat knowledge sources." };
  }
}
