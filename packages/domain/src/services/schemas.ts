import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";

export const serviceStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
]);

export const serviceSchema = z
  .object({
    id: catalogIdSchema,
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(80),
    defaultDurationMinutes: z.number().int().min(1).max(480),
    defaultPriceIdr: z.number().int().min(0).nullable(),
    status: serviceStatusSchema,
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const serviceListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: serviceStatusSchema.optional(),
    category: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const serviceListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(serviceSchema),
  })
  .strict();

export const createServiceInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(80),
    defaultDurationMinutes: z.number().int().min(1).max(480),
    defaultPriceIdr: z.number().int().min(0).nullable().optional(),
    status: serviceStatusSchema.default("active"),
  })
  .strict();

export const updateServiceInputSchema = z
  .object({
    id: catalogIdSchema,
    name: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    defaultDurationMinutes: z.number().int().min(1).max(480).optional(),
    defaultPriceIdr: z.number().int().min(0).nullable().optional(),
    status: serviceStatusSchema.optional(),
  })
  .strict()
  .refine(
    ({ id: _id, ...updates }) =>
      Object.values(updates).some((value) => value !== undefined),
    {
      message: "At least one service field must be provided to update.",
    },
  );
