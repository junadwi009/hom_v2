import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import {
  paymentListQuerySchema,
  paymentListResultSchema,
  paymentSchema,
  paymentStatusHistoryListQuerySchema,
  paymentStatusHistoryListResultSchema,
  paymentStatusHistorySchema,
} from "./schemas";
import type {
  PaymentRepository,
  PaymentStatusHistoryRepository,
} from "./repository";
import type { Payment, PaymentStatusHistory } from "./types";

export const mockPayments = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    clientPackageId: "51000000-0000-4000-8000-000000000001",
    packageName: "Mock Intro Package",
    amountIdr: 750000,
    paymentMethod: "cash",
    status: "paid",
    paidAt: "2026-06-03T02:00:00.000Z",
    referenceNumber: "MOCK-REF-0001",
    notes: "Mock cash payment at front desk.",
    createdByAppUserId: "94000000-0000-4000-8000-000000000001",
    updatedByAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-03T02:00:00.000Z",
    updatedAt: "2026-06-03T02:05:00.000Z",
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    clientId: "10000000-0000-4000-8000-000000000002",
    clientName: "Mock Client Beta",
    amountIdr: 1800000,
    paymentMethod: "bank_transfer",
    status: "pending",
    referenceNumber: "MOCK-REF-0002",
    notes: "Mock awaiting transfer confirmation.",
    createdByAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-03T03:00:00.000Z",
    updatedAt: "2026-06-03T03:00:00.000Z",
  },
  {
    id: "60000000-0000-4000-8000-000000000003",
    clientId: "10000000-0000-4000-8000-000000000003",
    clientName: "Mock Client Gamma",
    clientPackageId: "51000000-0000-4000-8000-000000000004",
    packageName: "Mock Monthly Membership",
    amountIdr: 3000000,
    paymentMethod: "e_wallet",
    status: "paid",
    paidAt: "2026-06-02T04:00:00.000Z",
    createdByAppUserId: "94000000-0000-4000-8000-000000000001",
    updatedByAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-02T03:30:00.000Z",
    updatedAt: "2026-06-02T04:00:00.000Z",
  },
  {
    id: "60000000-0000-4000-8000-000000000004",
    clientId: "10000000-0000-4000-8000-000000000004",
    clientName: "Mock Client Delta",
    amountIdr: 350000,
    paymentMethod: "card",
    status: "cancelled",
    notes: "Mock cancelled before settlement.",
    createdByAppUserId: "94000000-0000-4000-8000-000000000001",
    updatedByAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-01T02:00:00.000Z",
    updatedAt: "2026-06-01T05:00:00.000Z",
  },
  {
    id: "60000000-0000-4000-8000-000000000005",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    amountIdr: 500000,
    paymentMethod: "other",
    status: "failed",
    notes: "Mock failed manual attempt.",
    createdByAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-30T02:00:00.000Z",
    updatedAt: "2026-05-30T02:10:00.000Z",
  },
] as const satisfies readonly Payment[];

export const mockPaymentStatusHistory = [
  {
    id: "61000000-0000-4000-8000-000000000001",
    paymentId: "60000000-0000-4000-8000-000000000001",
    fromStatus: "pending",
    toStatus: "paid",
    reason: "Mock front desk confirmation.",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    metadata: { paymentId: "60000000-0000-4000-8000-000000000001" },
    createdAt: "2026-06-03T02:05:00.000Z",
  },
  {
    id: "61000000-0000-4000-8000-000000000002",
    paymentId: "60000000-0000-4000-8000-000000000002",
    toStatus: "pending",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    metadata: {},
    createdAt: "2026-06-03T03:00:00.000Z",
  },
  {
    id: "61000000-0000-4000-8000-000000000003",
    paymentId: "60000000-0000-4000-8000-000000000004",
    fromStatus: "pending",
    toStatus: "cancelled",
    reason: "Mock cancelled before settlement.",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    metadata: {},
    createdAt: "2026-06-01T05:00:00.000Z",
  },
] as const satisfies readonly PaymentStatusHistory[];

export function createMockPaymentRepository(
  seed: readonly Payment[] = mockPayments,
): PaymentRepository {
  const payments = seed.map((payment) => paymentSchema.parse(payment));

  return {
    async list(query = {}) {
      const parsedQuery = paymentListQuerySchema.parse(query);
      const filtered = payments.filter(
        (payment) =>
          (!parsedQuery.status || payment.status === parsedQuery.status) &&
          (!parsedQuery.paymentMethod ||
            payment.paymentMethod === parsedQuery.paymentMethod) &&
          (!parsedQuery.clientId ||
            payment.clientId === parsedQuery.clientId) &&
          (!parsedQuery.clientPackageId ||
            payment.clientPackageId === parsedQuery.clientPackageId) &&
          includesCatalogSearch(
            [payment.clientName, payment.packageName, payment.referenceNumber],
            parsedQuery.search,
          ),
      );

      return paymentListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return payments.find((payment) => payment.id === id) ?? null;
    },
  };
}

export function createMockPaymentStatusHistoryRepository(
  seed: readonly PaymentStatusHistory[] = mockPaymentStatusHistory,
): PaymentStatusHistoryRepository {
  const history = seed.map((item) => paymentStatusHistorySchema.parse(item));

  return {
    async list(query = {}) {
      const parsedQuery = paymentStatusHistoryListQuerySchema.parse(query);
      const filtered = history.filter(
        (item) =>
          (!parsedQuery.paymentId ||
            item.paymentId === parsedQuery.paymentId) &&
          (!parsedQuery.toStatus || item.toStatus === parsedQuery.toStatus) &&
          includesCatalogSearch(
            [item.toStatus, item.reason],
            parsedQuery.search,
          ),
      );

      return paymentStatusHistoryListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return history.find((item) => item.id === id) ?? null;
    },
  };
}
