import type { KnowledgeSource, KnowledgeSourceListResult } from "./types";

export type KnowledgeSourceListQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type KnowledgeRepository = {
  list(query?: KnowledgeSourceListQuery): Promise<KnowledgeSourceListResult>;
  getById(id: string): Promise<KnowledgeSource | null>;
};
