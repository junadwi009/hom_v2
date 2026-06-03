import {
  clientPackageListQuerySchema,
  clientPackageListResultSchema,
  type ClientPackageRepository,
} from "@hom/domain/packages";

import { PackageRepositoryError } from "@/lib/packages/errors";

import { mapClientPackageRow } from "./client-package-row-mapper";
import type { PackageSupabaseClient } from "./types";

const CLIENT_PACKAGE_SELECT = [
  "id",
  "client_id",
  "package_id",
  "purchased_at",
  "expires_at",
  "total_sessions",
  "remaining_sessions",
  "status",
  "created_at",
  "updated_at",
  "clients(full_name)",
  "packages(name)",
].join(",");

export function createSupabaseClientPackageRepository(
  supabase: PackageSupabaseClient,
): ClientPackageRepository {
  return {
    async list(query = {}) {
      const parsedQuery = clientPackageListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("client_packages")
        .select(CLIENT_PACKAGE_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.clientId) {
        request = request.eq("client_id", parsedQuery.clientId);
      }

      if (parsedQuery.packageId) {
        request = request.eq("package_id", parsedQuery.packageId);
      }

      if (parsedQuery.search) {
        throw new PackageRepositoryError({
          operation: "client_packages.list",
          table: "client_packages",
          code: "UNSUPPORTED_SEARCH",
        });
      }

      const response = await request
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (response.error) {
        throw PackageRepositoryError.fromSupabase(
          "client_packages.list",
          "client_packages",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return clientPackageListResultSchema.parse({
        items: rows.map(mapClientPackageRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("client_packages")
        .select(CLIENT_PACKAGE_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw PackageRepositoryError.fromSupabase(
          "client_packages.getById",
          "client_packages",
          response.error,
        );
      }

      return response.data ? mapClientPackageRow(response.data) : null;
    },
  };
}
