import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";

export const clientStatusSchema = z.enum([
  "active",
  "inactive",
  "prospect",
  "archived",
]);

const optionalContactTextSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .nullable()
  .optional();

export const clientSchema = z
  .object({
    id: catalogIdSchema,
    fullName: z.string().trim().min(1).max(120),
    status: clientStatusSchema,
    primaryPractitionerId: catalogIdSchema.nullable(),
    primaryPractitionerName: z.string().trim().min(1).max(120).nullable(),
    maskedPhone: z.string().trim().min(3).max(80).nullable(),
    maskedEmail: z.string().trim().min(3).max(120).nullable(),
    createdByAppUserId: catalogIdSchema.nullable(),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const clientListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: clientStatusSchema.optional(),
  })
  .strict();

export const clientListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(clientSchema),
  })
  .strict();

export const createClientInputSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    phone: optionalContactTextSchema,
    email: z.email().nullable().optional(),
    status: clientStatusSchema.default("active"),
    primaryPractitionerId: catalogIdSchema.nullable().optional(),
    createdByAppUserId: catalogIdSchema.nullable().optional(),
  })
  .strict();

export const updateClientInputSchema = z
  .object({
    id: catalogIdSchema,
    fullName: z.string().trim().min(1).max(120).optional(),
    phone: optionalContactTextSchema,
    email: z.email().nullable().optional(),
    status: clientStatusSchema.optional(),
    primaryPractitionerId: catalogIdSchema.nullable().optional(),
  })
  .strict()
  .refine(
    ({ id: _id, ...updates }) =>
      Object.values(updates).some((value) => value !== undefined),
    {
      message: "At least one client field must be provided to update.",
    },
  );
