import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";

export const packageStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
]);

export const packageTypeSchema = z.enum([
  "session_pack",
  "membership",
  "intro",
]);

export const clientPackageStatusSchema = z.enum([
  "active",
  "expired",
  "depleted",
  "cancelled",
]);

export const packageUsageChangeTypeSchema = z.enum([
  "assigned",
  "deducted",
  "reversed",
  "adjusted",
  "cancelled",
  "expired",
]);

const positiveSessionCountSchema = z.number().int().min(1);
const nonNegativeSessionCountSchema = z.number().int().min(0);
const validityDaysSchema = z.number().int().min(1);
const priceIdrSchema = z.number().int().min(0);
const usageQuantitySchema = z.number().int().min(1);
const safeOperationalReasonSchema = z
  .string()
  .trim()
  .min(1)
  .max(280)
  .refine((reason) => !containsSensitivePackageContent(reason), {
    message:
      "Package reasons must not include payment, clinical, WhatsApp, contact, or secret details.",
  });

const sensitivePackageTextPattern =
  /\b(?:payment|paid|card|bank|transfer|invoice|clinical|medical|diagnosis|diagnose|treatment|whatsapp|message|phone|email|contact|secret|token|api\s*key)\b/i;

function containsSensitivePackageContent(value: string) {
  return sensitivePackageTextPattern.test(value);
}

export const packageSchema = z
  .object({
    id: catalogIdSchema,
    name: z.string().trim().min(1).max(120),
    packageType: packageTypeSchema,
    totalSessions: positiveSessionCountSchema,
    validityDays: validityDaysSchema,
    priceIdr: priceIdrSchema,
    status: packageStatusSchema,
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const packageListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: packageStatusSchema.optional(),
    packageType: packageTypeSchema.optional(),
  })
  .strict();

export const packageListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(packageSchema),
  })
  .strict();

export const clientPackageSchema = z
  .object({
    id: catalogIdSchema,
    clientId: catalogIdSchema,
    clientName: z.string().trim().min(1).max(120),
    packageId: catalogIdSchema,
    packageName: z.string().trim().min(1).max(120),
    purchasedAt: catalogTimestampSchema,
    expiresAt: catalogTimestampSchema,
    totalSessions: positiveSessionCountSchema,
    remainingSessions: nonNegativeSessionCountSchema,
    status: clientPackageStatusSchema,
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict()
  .refine(
    ({ remainingSessions, totalSessions }) => remainingSessions <= totalSessions,
    {
      message: "Remaining sessions must not exceed total sessions.",
      path: ["remainingSessions"],
    },
  );

export const clientPackageListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: clientPackageStatusSchema.optional(),
    clientId: catalogIdSchema.optional(),
    packageId: catalogIdSchema.optional(),
  })
  .strict();

export const clientPackageListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(clientPackageSchema),
  })
  .strict();

export const packageUsageHistorySchema = z
  .object({
    id: catalogIdSchema,
    clientPackageId: catalogIdSchema,
    appointmentId: catalogIdSchema.optional(),
    changeType: packageUsageChangeTypeSchema,
    quantity: usageQuantitySchema,
    beforeRemaining: nonNegativeSessionCountSchema,
    afterRemaining: nonNegativeSessionCountSchema,
    reason: safeOperationalReasonSchema.optional(),
    actorAppUserId: catalogIdSchema.optional(),
    createdAt: catalogTimestampSchema,
  })
  .strict();

export const packageUsageHistoryListQuerySchema = catalogListQueryBaseSchema
  .extend({
    clientPackageId: catalogIdSchema.optional(),
    appointmentId: catalogIdSchema.optional(),
    changeType: packageUsageChangeTypeSchema.optional(),
  })
  .strict();

export const packageUsageHistoryListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(packageUsageHistorySchema),
  })
  .strict();

export const assignClientPackageInputSchema = z
  .object({
    clientId: catalogIdSchema,
    packageId: catalogIdSchema,
    purchasedAt: catalogTimestampSchema,
  })
  .strict();
