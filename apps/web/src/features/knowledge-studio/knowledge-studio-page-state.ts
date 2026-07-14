import type { KnowledgeSource } from "@hom/domain/knowledge";

export type KnowledgeSourceRow = {
  id: string;
  title: string;
  docType: string;
  scopes: string;
  status: string;
  version: number;
};

export type KnowledgeStudioPageState = { source: "mock" | "supabase" } & (
  | { status: "ready"; sources: KnowledgeSourceRow[] }
  | { status: "empty" }
  | { status: "permission_denied" }
  | { status: "configuration_error" }
  | { status: "error"; message: string }
);

export function toKnowledgeSourceRow(s: KnowledgeSource): KnowledgeSourceRow {
  return {
    id: s.id,
    title: s.title,
    docType: s.docType,
    scopes: s.scopes.join(", "),
    status: s.status,
    version: s.version,
  };
}
