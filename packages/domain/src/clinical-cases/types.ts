import type { z } from "zod";
import type {
  clientClinicalCaseSchema,
  clinicalCaseListByClientQuerySchema,
} from "./schemas";

export type ClientClinicalCase = z.infer<typeof clientClinicalCaseSchema>;
export type ClinicalCaseListByClientQuery = z.infer<
  typeof clinicalCaseListByClientQuerySchema
>;
