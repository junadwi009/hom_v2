import type { z } from "zod";

import type {
  cancelPaymentInputSchema,
  createManualPaymentInputSchema,
  createPaymentStatusSchema,
  markPaymentPaidInputSchema,
  paymentListQuerySchema,
  paymentListResultSchema,
  paymentMethodSchema,
  paymentSchema,
  paymentStatusHistoryListQuerySchema,
  paymentStatusHistoryListResultSchema,
  paymentStatusHistorySchema,
  paymentStatusSchema,
} from "./schemas";

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
export type PaymentListResult = z.infer<typeof paymentListResultSchema>;

export type PaymentStatusHistory = z.infer<typeof paymentStatusHistorySchema>;
export type PaymentStatusHistoryListQuery = z.infer<
  typeof paymentStatusHistoryListQuerySchema
>;
export type PaymentStatusHistoryListResult = z.infer<
  typeof paymentStatusHistoryListResultSchema
>;

export type CreatePaymentStatus = z.infer<typeof createPaymentStatusSchema>;
export type CreateManualPaymentInput = z.infer<
  typeof createManualPaymentInputSchema
>;
export type MarkPaymentPaidInput = z.infer<typeof markPaymentPaidInputSchema>;
export type CancelPaymentInput = z.infer<typeof cancelPaymentInputSchema>;
