import {
  practitionerListQuerySchema,
  practitionerListResultSchema,
  type PractitionerRepository,
} from "@hom/domain/practitioners";

import { CatalogRepositoryError } from "@/lib/catalog/errors";

import { mapPractitionerRow } from "./practitioner-row-mapper";
import type { CatalogSupabaseClient } from "./types";

const PRACTITIONER_SELECT = [
  "id",
  "app_user_id",
  "display_name",
  "email",
  "status",
  "created_at",
  "updated_at",
].join(",");

export function createSupabasePractitionerRepository(
  supabase: CatalogSupabaseClient,
): PractitionerRepository {
  return {
    async list(query = {}) {
      const parsedQuery = practitionerListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("practitioners")
        .select(PRACTITIONER_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.search) {
        request = request.ilike(
          "display_name",
          toSearchPattern(parsedQuery.search),
        );
      }

      const response = await request
        .order("display_name", { ascending: true })
        .range(from, to);

      if (response.error) {
        throw CatalogRepositoryError.fromSupabase(
          "practitioners.list",
          "practitioners",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return practitionerListResultSchema.parse({
        items: rows.map(mapPractitionerRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("practitioners")
        .select(PRACTITIONER_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw CatalogRepositoryError.fromSupabase(
          "practitioners.getById",
          "practitioners",
          response.error,
        );
      }

      return response.data ? mapPractitionerRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
