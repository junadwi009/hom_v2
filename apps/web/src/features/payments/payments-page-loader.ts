import type { PaymentRepository } from "@hom/domain/payments";

import { getDataMode } from "@/lib/env/app-mode";
import { PaymentRepositoryError } from "@/lib/payments/errors";
import {
  createPaymentRepositories,
  type PaymentRepositories,
} from "@/lib/payments/repository-factory";

import {
  toPaymentTableRow,
  type PaymentDataSource,
  type PaymentsPageState,
} from "./payments-page-state";

type LoadPaymentsPageOptions = {
  repositories?: Pick<PaymentRepositories, "payments">;
  source?: PaymentDataSource;
};

const DEFAULT_PAYMENT_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadPaymentsPage(
  options: LoadPaymentsPageOptions = {},
): Promise<PaymentsPageState> {
  const source = options.source ?? getDataMode();

  try {
    const paymentRepository =
      options.repositories?.payments ??
      (await createPaymentRepositories()).payments;
    const result = await paymentRepository.list(DEFAULT_PAYMENT_LIST_QUERY);

    if (result.total === 0) {
      return {
        status: "empty",
        source,
      };
    }

    return {
      status: "ready",
      source,
      rows: result.items.map(toPaymentTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafePaymentsPageErrorState(error, source);
  }
}

function toSafePaymentsPageErrorState(
  error: unknown,
  source: PaymentDataSource,
): PaymentsPageState {
  if (source === "supabase" && isSupabaseConfigurationError(error)) {
    return {
      status: "configuration_error",
      source,
    };
  }

  if (source === "supabase" && isPermissionError(error)) {
    return {
      status: "permission_denied",
      source,
    };
  }

  return {
    status: "error",
    source,
  };
}

function isPermissionError(error: unknown) {
  return (
    error instanceof PaymentRepositoryError &&
    (error.code === "42501" || error.status === 401 || error.status === 403)
  );
}

function isSupabaseConfigurationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  );
}

export function createEmptyPaymentRepository(): PaymentRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_PAYMENT_LIST_QUERY.page,
        pageSize: DEFAULT_PAYMENT_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
