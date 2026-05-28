import {
  serviceListQuerySchema,
  serviceListResultSchema,
  type ServiceRepository,
} from "@hom/domain/services";

import { CatalogRepositoryError } from "@/lib/catalog/errors";

import { mapServiceRow } from "./service-row-mapper";
import type { CatalogSupabaseClient } from "./types";

const SERVICE_SELECT = [
  "id",
  "name",
  "category",
  "default_duration_minutes",
  "default_price_idr",
  "status",
  "created_at",
  "updated_at",
].join(",");

export function createSupabaseServiceRepository(
  supabase: CatalogSupabaseClient,
): ServiceRepository {
  return {
    async list(query = {}) {
      const parsedQuery = serviceListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("services")
        .select(SERVICE_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.category) {
        request = request.eq("category", parsedQuery.category);
      }

      if (parsedQuery.search) {
        const pattern = toSearchPattern(parsedQuery.search);
        request = request.or(`name.ilike.${pattern},category.ilike.${pattern}`);
      }

      const response = await request
        .order("name", { ascending: true })
        .range(from, to);

      if (response.error) {
        throw CatalogRepositoryError.fromSupabase(
          "services.list",
          "services",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return serviceListResultSchema.parse({
        items: rows.map(mapServiceRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("services")
        .select(SERVICE_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw CatalogRepositoryError.fromSupabase(
          "services.getById",
          "services",
          response.error,
        );
      }

      return response.data ? mapServiceRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
