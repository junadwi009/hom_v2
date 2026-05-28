import type { z } from "zod";

import type {
  authModeSchema,
  currentUserSchema,
} from "./schemas";

export type AuthMode = z.infer<typeof authModeSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;

export type AuthBoundary = {
  getCurrentUser(): Promise<CurrentUser | null>;
  requireAuthenticatedUser(): Promise<CurrentUser>;
};
