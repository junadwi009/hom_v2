import type { z } from "zod";

import type {
  createPractitionerInputSchema,
  practitionerListQuerySchema,
  practitionerListResultSchema,
  practitionerSchema,
  practitionerStatusSchema,
  updatePractitionerInputSchema,
} from "./schemas";

export type PractitionerStatus = z.infer<typeof practitionerStatusSchema>;
export type Practitioner = z.infer<typeof practitionerSchema>;
export type PractitionerListQuery = z.infer<
  typeof practitionerListQuerySchema
>;
export type PractitionerListResult = z.infer<
  typeof practitionerListResultSchema
>;
export type CreatePractitionerInput = z.infer<
  typeof createPractitionerInputSchema
>;
export type UpdatePractitionerInput = z.infer<
  typeof updatePractitionerInputSchema
>;
