import type {
  Payment,
  PaymentListQuery,
  PaymentListResult,
  PaymentStatusHistory,
  PaymentStatusHistoryListQuery,
  PaymentStatusHistoryListResult,
} from "./types";

export type PaymentRepository = {
  list(query?: Partial<PaymentListQuery>): Promise<PaymentListResult>;
  getById(id: string): Promise<Payment | null>;
};

export type PaymentStatusHistoryRepository = {
  list(
    query?: Partial<PaymentStatusHistoryListQuery>,
  ): Promise<PaymentStatusHistoryListResult>;
  getById(id: string): Promise<PaymentStatusHistory | null>;
};
