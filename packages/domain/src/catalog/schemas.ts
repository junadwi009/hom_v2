import { z } from "zod";

export const catalogIdSchema = z.uuid();

export const catalogTimestampSchema = z.string().datetime();

export const catalogSearchSchema = z.string().trim().max(120).default("");

export const catalogPageSchema = z.coerce.number().int().min(1).default(1);

export const catalogPageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20);

export const catalogListQueryBaseSchema = z
  .object({
    search: catalogSearchSchema,
    page: catalogPageSchema,
    pageSize: catalogPageSizeSchema,
  })
  .strict();

export const catalogListResultMetaSchema = z
  .object({
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
  })
  .strict();
