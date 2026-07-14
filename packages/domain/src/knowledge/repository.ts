import type { KnowledgeSource, KnowledgeSourceListQuery, KnowledgeSourceListResult } from "./types";

export type KnowledgeRepository = {
  list(query?: Partial<KnowledgeSourceListQuery>): Promise<KnowledgeSourceListResult>;
  getById(id: string): Promise<KnowledgeSource | null>;
};
