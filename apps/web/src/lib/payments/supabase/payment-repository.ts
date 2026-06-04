import {
  paymentListQuerySchema,
  paymentListResultSchema,
  type PaymentRepository,
} from "@hom/domain/payments";

import { PaymentRepositoryError } from "@/lib/payments/errors";

import { mapPaymentRow } from "./payment-row-mapper";
import type { PaymentSupabaseClient } from "./types";

const PAYMENT_SELECT = [
  "id",
  "client_id",
  "client_package_id",
  "amount_idr",
  "payment_method",
  "status",
  "paid_at",
  "reference_number",
  "notes",
  "created_by_app_user_id",
  "updated_by_app_user_id",
  "created_at",
  "updated_at",
  "clients(full_name)",
  "client_packages(packages(name))",
].join(",");

export function createSupabasePaymentRepository(
  supabase: PaymentSupabaseClient,
): PaymentRepository {
  return {
    async list(query = {}) {
      const parsedQuery = paymentListQuerySchema.parse(query);
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("payments")
        .select(PAYMENT_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.paymentMethod) {
        request = request.eq("payment_method", parsedQuery.paymentMethod);
      }

      if (parsedQuery.clientId) {
        request = request.eq("client_id", parsedQuery.clientId);
      }

      if (parsedQuery.clientPackageId) {
        request = request.eq("client_package_id", parsedQuery.clientPackageId);
      }

      if (parsedQuery.search) {
        request = request.or(
          `payment_method.ilike.${toSearchPattern(parsedQuery.search)},reference_number.ilike.${toSearchPattern(parsedQuery.search)}`,
        );
      }

      const response = await request
        .order("created_at", { ascending: false })
        .range(from, to);

      if (response.error) {
        throw PaymentRepositoryError.fromSupabase(
          "payments.list",
          "payments",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return paymentListResultSchema.parse({
        items: rows.map(mapPaymentRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("payments")
        .select(PAYMENT_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw PaymentRepositoryError.fromSupabase(
          "payments.getById",
          "payments",
          response.error,
        );
      }

      return response.data ? mapPaymentRow(response.data) : null;
    },
  };
}

function toSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
