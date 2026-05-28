import type { z } from "zod";

import type {
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
} from "./schemas";

export type CatalogListQueryBase = z.infer<
  typeof catalogListQueryBaseSchema
>;

export type CatalogListResultMeta = z.infer<
  typeof catalogListResultMetaSchema
>;
