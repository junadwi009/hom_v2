import { z } from "zod";

export const clientClinicalCaseSchema = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    caseStatus: z.string().trim().min(1).max(40),
    severity: z.string().trim().min(1).max(40),
    summary: z.string().trim().max(2000).nullable(),
    openedOn: z.string().trim().min(1),
  })
  .strict();

export const clinicalCaseListByClientQuerySchema = z
  .object({ clientId: z.string().uuid() })
  .strict();
