import {
  clientListQuerySchema,
  clientListResultSchema,
  type ClientRepository,
} from "@hom/domain/clients";

import { CatalogRepositoryError } from "@/lib/catalog/errors";

import { mapClientRow } from "./client-row-mapper";
import type { CatalogSupabaseClient } from "./types";

const CLIENT_SELECT = [
  "id",
  "full_name",
  "phone",
  "email",
  "status",
  "primary_practitioner_id",
  "created_by_app_user_id",
  "created_at",
  "updated_at",
  "practitioners(display_name)",
].join(",");

export function createSupabaseClientRepository(
  supabase: CatalogSupabaseClient,
): ClientRepository {
  return {
    async list(query = {}) {
      const parsedQuery = clientListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("clients")
        .select(CLIENT_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.search) {
        request = request.ilike(
          "full_name",
          toSearchPattern(parsedQuery.search),
        );
      }

      const response = await request
        .order("full_name", { ascending: true })
        .range(from, to);

      if (response.error) {
        throw CatalogRepositoryError.fromSupabase(
          "clients.list",
          "clients",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return clientListResultSchema.parse({
        items: rows.map(mapClientRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("clients")
        .select(CLIENT_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw CatalogRepositoryError.fromSupabase(
          "clients.getById",
          "clients",
          response.error,
        );
      }

      return response.data ? mapClientRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
