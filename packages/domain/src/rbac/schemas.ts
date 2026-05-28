import { z } from "zod";

import {
  knowledgeSourceStatuses,
  permissionKeys,
  roleNames,
} from "./constants";

export const roleNameSchema = z.enum(roleNames);
export const permissionKeySchema = z.enum(permissionKeys);
export const knowledgeSourceStatusSchema = z.enum(knowledgeSourceStatuses);

export const roleListSchema = z.array(roleNameSchema);
export const permissionListSchema = z.array(permissionKeySchema);
