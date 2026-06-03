import {
  packageListQuerySchema,
  packageListResultSchema,
  type PackageRepository,
} from "@hom/domain/packages";

import { PackageRepositoryError } from "@/lib/packages/errors";

import { mapPackageRow } from "./package-row-mapper";
import type { PackageSupabaseClient } from "./types";

const PACKAGE_SELECT = [
  "id",
  "name",
  "package_type",
  "total_sessions",
  "validity_days",
  "price_idr",
  "status",
  "created_at",
  "updated_at",
].join(",");

export function createSupabasePackageRepository(
  supabase: PackageSupabaseClient,
): PackageRepository {
  return {
    async list(query = {}) {
      const parsedQuery = packageListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("packages")
        .select(PACKAGE_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.packageType) {
        request = request.eq("package_type", parsedQuery.packageType);
      }

      if (parsedQuery.search) {
        request = request.or(
          `name.ilike.${toSearchPattern(parsedQuery.search)},package_type.ilike.${toSearchPattern(parsedQuery.search)}`,
        );
      }

      const response = await request
        .order("name", { ascending: true })
        .range(from, to);

      if (response.error) {
        throw PackageRepositoryError.fromSupabase(
          "packages.list",
          "packages",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return packageListResultSchema.parse({
        items: rows.map(mapPackageRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("packages")
        .select(PACKAGE_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw PackageRepositoryError.fromSupabase(
          "packages.getById",
          "packages",
          response.error,
        );
      }

      return response.data ? mapPackageRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
