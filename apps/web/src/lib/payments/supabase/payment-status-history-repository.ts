import {
  paymentStatusHistoryListQuerySchema,
  paymentStatusHistoryListResultSchema,
  type PaymentStatusHistoryRepository,
} from "@hom/domain/payments";

import { PaymentRepositoryError } from "@/lib/payments/errors";

import { mapPaymentStatusHistoryRow } from "./payment-status-history-row-mapper";
import type { PaymentSupabaseClient } from "./types";

const PAYMENT_STATUS_HISTORY_SELECT = [
  "id",
  "payment_id",
  "from_status",
  "to_status",
  "reason",
  "actor_app_user_id",
  "metadata",
  "created_at",
].join(",");

export function createSupabasePaymentStatusHistoryRepository(
  supabase: PaymentSupabaseClient,
): PaymentStatusHistoryRepository {
  return {
    async list(query = {}) {
      const parsedQuery = paymentStatusHistoryListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("payment_status_history")
        .select(PAYMENT_STATUS_HISTORY_SELECT, { count: "exact" });

      if (parsedQuery.paymentId) {
        request = request.eq("payment_id", parsedQuery.paymentId);
      }

      if (parsedQuery.toStatus) {
        request = request.eq("to_status", parsedQuery.toStatus);
      }

      if (parsedQuery.search) {
        request = request.or(
          `to_status.ilike.${toSearchPattern(parsedQuery.search)},reason.ilike.${toSearchPattern(parsedQuery.search)}`,
        );
      }

      const response = await request
        .order("created_at", { ascending: false })
        .range(from, to);

      if (response.error) {
        throw PaymentRepositoryError.fromSupabase(
          "payment_status_history.list",
          "payment_status_history",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return paymentStatusHistoryListResultSchema.parse({
        items: rows.map(mapPaymentStatusHistoryRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("payment_status_history")
        .select(PAYMENT_STATUS_HISTORY_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw PaymentRepositoryError.fromSupabase(
          "payment_status_history.getById",
          "payment_status_history",
          response.error,
        );
      }

      return response.data ? mapPaymentStatusHistoryRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
