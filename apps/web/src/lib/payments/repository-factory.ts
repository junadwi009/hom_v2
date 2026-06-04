import {
  createMockPaymentRepository,
  createMockPaymentStatusHistoryRepository,
  type PaymentRepository,
  type PaymentStatusHistoryRepository,
} from "@hom/domain/payments";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSupabasePaymentRepository } from "./supabase/payment-repository";
import { createSupabasePaymentStatusHistoryRepository } from "./supabase/payment-status-history-repository";
import type { PaymentSupabaseClient } from "./supabase/types";

export type PaymentRepositories = {
  payments: PaymentRepository;
  paymentStatusHistory: PaymentStatusHistoryRepository;
};

type CreatePaymentRepositoriesOptions = {
  createSupabaseClient?: () => Promise<PaymentSupabaseClient>;
};

export async function createPaymentRepositories(
  options: CreatePaymentRepositoriesOptions = {},
): Promise<PaymentRepositories> {
  if (getDataMode() !== "supabase") {
    return createMockPaymentRepositories();
  }

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createPaymentSupabaseClient();

  return createSupabasePaymentRepositories(supabase);
}

export function createMockPaymentRepositories(): PaymentRepositories {
  return {
    payments: createMockPaymentRepository(),
    paymentStatusHistory: createMockPaymentStatusHistoryRepository(),
  };
}

export function createSupabasePaymentRepositories(
  supabase: PaymentSupabaseClient,
): PaymentRepositories {
  return {
    payments: createSupabasePaymentRepository(supabase),
    paymentStatusHistory:
      createSupabasePaymentStatusHistoryRepository(supabase),
  };
}

async function createPaymentSupabaseClient(): Promise<PaymentSupabaseClient> {
  return (await createSupabaseServerClient()) as unknown as PaymentSupabaseClient;
}
