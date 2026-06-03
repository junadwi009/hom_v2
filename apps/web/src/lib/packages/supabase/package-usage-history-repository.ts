import {
  packageUsageHistoryListQuerySchema,
  packageUsageHistoryListResultSchema,
  type PackageUsageHistoryRepository,
} from "@hom/domain/packages";

import { PackageRepositoryError } from "@/lib/packages/errors";

import { mapPackageUsageHistoryRow } from "./package-usage-history-row-mapper";
import type { PackageSupabaseClient } from "./types";

const PACKAGE_USAGE_HISTORY_SELECT = [
  "id",
  "client_package_id",
  "appointment_id",
  "change_type",
  "quantity",
  "before_remaining",
  "after_remaining",
  "reason",
  "actor_app_user_id",
  "created_at",
].join(",");

export function createSupabasePackageUsageHistoryRepository(
  supabase: PackageSupabaseClient,
): PackageUsageHistoryRepository {
  return {
    async list(query = {}) {
      const parsedQuery = packageUsageHistoryListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("package_usage_history")
        .select(PACKAGE_USAGE_HISTORY_SELECT, { count: "exact" });

      if (parsedQuery.clientPackageId) {
        request = request.eq("client_package_id", parsedQuery.clientPackageId);
      }

      if (parsedQuery.appointmentId) {
        request = request.eq("appointment_id", parsedQuery.appointmentId);
      }

      if (parsedQuery.changeType) {
        request = request.eq("change_type", parsedQuery.changeType);
      }

      if (parsedQuery.search) {
        request = request.or(
          `change_type.ilike.${toSearchPattern(parsedQuery.search)},reason.ilike.${toSearchPattern(parsedQuery.search)}`,
        );
      }

      const response = await request
        .order("created_at", { ascending: false })
        .range(from, to);

      if (response.error) {
        throw PackageRepositoryError.fromSupabase(
          "package_usage_history.list",
          "package_usage_history",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return packageUsageHistoryListResultSchema.parse({
        items: rows.map(mapPackageUsageHistoryRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("package_usage_history")
        .select(PACKAGE_USAGE_HISTORY_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw PackageRepositoryError.fromSupabase(
          "package_usage_history.getById",
          "package_usage_history",
          response.error,
        );
      }

      return response.data ? mapPackageUsageHistoryRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
