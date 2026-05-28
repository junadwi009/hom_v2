import { z } from "zod";

import { apiErrorCodes } from "./constants";

export const apiErrorCodeSchema = z.enum(apiErrorCodes);

export const apiErrorDetailsSchema = z.record(z.string(), z.unknown());

export const apiErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: apiErrorDetailsSchema.optional(),
  }),
});
