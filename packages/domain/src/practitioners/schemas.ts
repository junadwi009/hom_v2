import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";

export const practitionerStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
]);

export const practitionerSchema = z
  .object({
    id: catalogIdSchema,
    appUserId: catalogIdSchema.nullable(),
    displayName: z.string().trim().min(1).max(120),
    status: practitionerStatusSchema,
    maskedEmail: z.string().trim().min(3).max(120).nullable(),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const practitionerListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: practitionerStatusSchema.optional(),
  })
  .strict();

export const practitionerListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(practitionerSchema),
  })
  .strict();

export const createPractitionerInputSchema = z
  .object({
    appUserId: catalogIdSchema.nullable().optional(),
    displayName: z.string().trim().min(1).max(120),
    email: z.email().nullable().optional(),
    status: practitionerStatusSchema.default("active"),
  })
  .strict();

export const updatePractitionerInputSchema = z
  .object({
    id: catalogIdSchema,
    appUserId: catalogIdSchema.nullable().optional(),
    displayName: z.string().trim().min(1).max(120).optional(),
    email: z.email().nullable().optional(),
    status: practitionerStatusSchema.optional(),
  })
  .strict()
  .refine(
    ({ id: _id, ...updates }) =>
      Object.values(updates).some((value) => value !== undefined),
    {
      message: "At least one practitioner field must be provided to update.",
    },
  );
