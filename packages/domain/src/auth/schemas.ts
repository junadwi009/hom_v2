import { z } from "zod";

import {
  permissionListSchema,
  roleListSchema,
} from "../rbac/schemas";

export const authModeSchema = z.enum(["mock", "supabase"]);

export const appUserStatusSchema = z.enum([
  "active",
  "inactive",
  "invited",
  "suspended",
]);

export const currentUserSchema = z.object({
  id: z.uuid(),
  authUserId: z.uuid().nullable(),
  email: z.email(),
  fullName: z.string().min(1),
  status: appUserStatusSchema,
  roles: roleListSchema,
  permissions: permissionListSchema,
});
