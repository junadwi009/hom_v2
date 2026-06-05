import { z } from "zod";

import { catalogIdSchema, catalogTimestampSchema } from "../catalog";
import { roleNameSchema } from "../rbac";

export const adminUserStatusSchema = z.enum([
  "active",
  "inactive",
  "invited",
  "suspended",
]);

export const adminUserSchema = z
  .object({
    id: catalogIdSchema,
    authUserId: catalogIdSchema.nullable(),
    fullName: z.string().trim().min(1).max(120),
    email: z.email().max(180),
    status: adminUserStatusSchema,
    roles: z.array(roleNameSchema),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict();

export const adminUserListResultSchema = z
  .object({
    items: z.array(adminUserSchema),
  })
  .strict();

export const createAdminUserInputSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    email: z.email().max(180),
    password: z.string().min(8).max(72),
    roles: z.array(roleNameSchema).min(1),
  })
  .strict();

export const setAdminUserStatusInputSchema = z
  .object({
    id: catalogIdSchema,
    status: adminUserStatusSchema,
  })
  .strict();

export const setAdminUserRolesInputSchema = z
  .object({
    id: catalogIdSchema,
    roles: z.array(roleNameSchema).min(1),
  })
  .strict();
