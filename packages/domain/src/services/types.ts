import type { z } from "zod";

import type {
  createServiceInputSchema,
  serviceListQuerySchema,
  serviceListResultSchema,
  serviceSchema,
  serviceStatusSchema,
  updateServiceInputSchema,
} from "./schemas";

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
export type ServiceListResult = z.infer<typeof serviceListResultSchema>;
export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;
