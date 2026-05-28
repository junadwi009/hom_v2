import { z } from "zod";

export const auditRiskLevelSchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const auditActionSchema = z
  .string()
  .min(3)
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);

export const auditMetadataSchema = z.record(z.string(), z.unknown());

export const auditLogInputSchema = z.object({
  actorUserId: z.uuid().nullable(),
  actorAuthUserId: z.uuid().nullable(),
  action: auditActionSchema,
  targetType: z.string().min(1),
  targetId: z.uuid().nullable(),
  riskLevel: auditRiskLevelSchema,
  metadata: auditMetadataSchema.default({}),
  requestId: z.string().min(1).nullable().optional(),
  ipAddress: z.string().min(1).nullable().optional(),
  userAgent: z.string().min(1).nullable().optional(),
});
