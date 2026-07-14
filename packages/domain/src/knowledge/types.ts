import type { z } from "zod";

import type {
  createKnowledgeSourceInputSchema,
  knowledgeQueryInputSchema,
  knowledgeScopeSchema,
  knowledgeSourceListQuerySchema,
  knowledgeSourceListResultSchema,
  knowledgeSourceSchema,
  publishKnowledgeSourceInputSchema,
} from "./schemas";

export type KnowledgeScope = z.infer<typeof knowledgeScopeSchema>;
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
export type CreateKnowledgeSourceInput = z.infer<typeof createKnowledgeSourceInputSchema>;
export type PublishKnowledgeSourceInput = z.infer<typeof publishKnowledgeSourceInputSchema>;
export type KnowledgeQueryInput = z.infer<typeof knowledgeQueryInputSchema>;
export type KnowledgeSourceListQuery = z.infer<typeof knowledgeSourceListQuerySchema>;
export type KnowledgeSourceListResult = z.infer<typeof knowledgeSourceListResultSchema>;
