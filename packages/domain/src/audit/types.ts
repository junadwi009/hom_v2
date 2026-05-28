import type { z } from "zod";

import type {
  auditLogInputSchema,
  auditRiskLevelSchema,
} from "./schemas";

export type AuditRiskLevel = z.infer<typeof auditRiskLevelSchema>;
export type AuditLogInput = z.infer<typeof auditLogInputSchema>;
export type AuditMetadata = Record<string, unknown>;
