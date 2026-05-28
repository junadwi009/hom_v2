import type { z } from "zod";

import type {
  clientListQuerySchema,
  clientListResultSchema,
  clientSchema,
  clientStatusSchema,
  createClientInputSchema,
  updateClientInputSchema,
} from "./schemas";

export type ClientStatus = z.infer<typeof clientStatusSchema>;
export type Client = z.infer<typeof clientSchema>;
export type ClientListQuery = z.infer<typeof clientListQuerySchema>;
export type ClientListResult = z.infer<typeof clientListResultSchema>;
export type CreateClientInput = z.infer<typeof createClientInputSchema>;
export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;
