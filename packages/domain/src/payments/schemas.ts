import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";

export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
]);

export const paymentMethodSchema = z.enum([
  "cash",
  "bank_transfer",
  "card",
  "e_wallet",
  "other",
]);

const amountIdrSchema = z.number().int().min(1);

// Reject card numbers, bank account numbers, gateway tokens, contact details,
// clinical/WhatsApp content, and API keys/secrets. Plain operational words such
// as "cash" or "bank transfer" remain allowed.
const sensitivePaymentPatterns = [
  /(?:\d[ -]?){12,}/, // long digit runs (card / bank account numbers)
  /\b(?:sk|pk|rk|whsec)_[a-z0-9_]{6,}/i, // gateway / live keys
  /\bsk-[a-z0-9_-]{8,}/i, // provider secret keys
  /\bghp_[a-z0-9]{8,}/i, // tokens
  /\b(?:api[\s_-]?key|secret|token|password|authorization|bearer)\b/i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email
  /\+\d[\d\s().-]{7,}\d/, // international phone
  /\b(?:clinical|medical|diagnosis|diagnose|treatment)\b/i, // clinical
  /\b(?:whatsapp|chat transcript|message content)\b/i, // WhatsApp content
  /\b(?:card number|account number|cvv|cvc|routing)\b/i, // explicit secrets
] as const;

function containsSensitivePaymentContent(value: string) {
  return sensitivePaymentPatterns.some((pattern) => pattern.test(value));
}

const safeOperationalTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(280)
  .refine((value) => !containsSensitivePaymentContent(value), {
    message:
      "Payment text must not include card, bank account, gateway token, contact, clinical, WhatsApp, or secret details.",
  });

const safeReferenceNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => !containsSensitivePaymentContent(value), {
    message:
      "Reference number must not include card, bank account, gateway token, contact, or secret details.",
  });

const safeMetadataSchema = z
  .record(z.string(), z.unknown())
  .default({});

export const paymentSchema = z
  .object({
    id: catalogIdSchema,
    clientId: catalogIdSchema,
    clientName: z.string().trim().min(1).max(120),
    clientPackageId: catalogIdSchema.optional(),
    packageName: z.string().trim().min(1).max(120).optional(),
    amountIdr: amountIdrSchema,
    paymentMethod: paymentMethodSchema,
    status: paymentStatusSchema,
    paidAt: catalogTimestampSchema.optional(),
    referenceNumber: safeReferenceNumberSchema.optional(),
    notes: safeOperationalTextSchema.optional(),
    createdByAppUserId: catalogIdSchema.optional(),
    updatedByAppUserId: catalogIdSchema.optional(),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const paymentListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: paymentStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    clientId: catalogIdSchema.optional(),
    clientPackageId: catalogIdSchema.optional(),
  })
  .strict();

export const paymentListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(paymentSchema),
  })
  .strict();

export const paymentStatusHistorySchema = z
  .object({
    id: catalogIdSchema,
    paymentId: catalogIdSchema,
    fromStatus: paymentStatusSchema.optional(),
    toStatus: paymentStatusSchema,
    reason: safeOperationalTextSchema.optional(),
    actorAppUserId: catalogIdSchema.optional(),
    metadata: safeMetadataSchema,
    createdAt: catalogTimestampSchema,
  })
  .strict();

export const paymentStatusHistoryListQuerySchema = catalogListQueryBaseSchema
  .extend({
    paymentId: catalogIdSchema.optional(),
    toStatus: paymentStatusSchema.optional(),
  })
  .strict();

export const paymentStatusHistoryListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(paymentStatusHistorySchema),
  })
  .strict();

export const createPaymentStatusSchema = z.enum(["pending", "paid"]);

export const createManualPaymentInputSchema = z
  .object({
    clientId: catalogIdSchema,
    clientPackageId: catalogIdSchema.optional(),
    amountIdr: amountIdrSchema,
    paymentMethod: paymentMethodSchema,
    status: createPaymentStatusSchema,
    paidAt: catalogTimestampSchema.optional(),
    referenceNumber: safeReferenceNumberSchema.optional(),
    notes: safeOperationalTextSchema.optional(),
  })
  .strict()
  .refine((input) => input.status !== "paid" || input.paidAt !== undefined, {
    message: "paidAt is required when status is paid.",
    path: ["paidAt"],
  })
  .refine((input) => input.status !== "pending" || input.paidAt === undefined, {
    message: "paidAt is not allowed when status is pending.",
    path: ["paidAt"],
  });

export const markPaymentPaidInputSchema = z
  .object({
    paymentId: catalogIdSchema,
    paidAt: catalogTimestampSchema,
  })
  .strict();

export const cancelPaymentInputSchema = z
  .object({
    paymentId: catalogIdSchema,
    reason: safeOperationalTextSchema,
  })
  .strict();
