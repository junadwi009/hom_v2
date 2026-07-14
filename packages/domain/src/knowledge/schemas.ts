import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";
import { knowledgeSourceStatusSchema } from "../rbac";

export const knowledgeScopeSchema = z.enum([
  "public_chatbot",
  "internal_admin",
  "clinical_safety",
  "finance",
  "marketing",
  "owner_only",
]);

export const knowledgeSourceSchema = z
  .object({
    id: catalogIdSchema,
    title: z.string().trim().min(1).max(160),
    docType: z.string().trim().min(1).max(60),
    scopes: z.array(knowledgeScopeSchema).min(1),
    status: knowledgeSourceStatusSchema,
    version: z.number().int().min(1),
    confidence: z.number().min(0).max(1).nullable(),
    extractedText: z.string().nullable(),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const createKnowledgeSourceInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    docType: z.string().trim().min(1).max(60),
    scopes: z.array(knowledgeScopeSchema).min(1),
  })
  .strict();

export const publishKnowledgeSourceInputSchema = z
  .object({
    sourceId: catalogIdSchema,
    extractedText: z.string().trim().min(1).max(200_000),
  })
  .strict();

export const knowledgeQueryInputSchema = z
  .object({
    question: z.string().trim().min(3).max(500),
    scope: knowledgeScopeSchema,
  })
  .strict();

export const businessAgentQueryInputSchema = z
  .object({ question: z.string().trim().min(3).max(500) })
  .strict();

export const knowledgeSourceListQuerySchema = catalogListQueryBaseSchema.strict();

export const knowledgeSourceListResultSchema = catalogListResultMetaSchema
  .extend({ items: z.array(knowledgeSourceSchema) })
  .strict();
