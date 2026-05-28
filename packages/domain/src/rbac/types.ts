import type { z } from "zod";

import type {
  knowledgeSourceStatusSchema,
  permissionKeySchema,
  roleNameSchema,
} from "./schemas";

export type RoleName = z.infer<typeof roleNameSchema>;
export type PermissionKey = z.infer<typeof permissionKeySchema>;
export type KnowledgeSourceStatus = z.infer<
  typeof knowledgeSourceStatusSchema
>;

export type ActorWithPermissions = {
  readonly permissions: readonly PermissionKey[];
};
