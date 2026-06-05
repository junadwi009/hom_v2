import type { z } from "zod";

import type {
  adminUserListResultSchema,
  adminUserSchema,
  adminUserStatusSchema,
  createAdminUserInputSchema,
  setAdminUserRolesInputSchema,
  setAdminUserStatusInputSchema,
} from "./schemas";

export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserListResult = z.infer<typeof adminUserListResultSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserInputSchema>;
export type SetAdminUserStatusInput = z.infer<
  typeof setAdminUserStatusInputSchema
>;
export type SetAdminUserRolesInput = z.infer<
  typeof setAdminUserRolesInputSchema
>;
