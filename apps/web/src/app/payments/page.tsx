import { cancelPaymentAction } from "@/features/payments/cancel-payment-action";
import { createPaymentAction } from "@/features/payments/create-payment-action";
import { loadCreatePaymentOptions } from "@/features/payments/create-payment-options-loader";
import { markPaidPaymentAction } from "@/features/payments/mark-paid-payment-action";
import { PaymentsPage } from "@/features/payments/payments-page";
import { loadPaymentsPage } from "@/features/payments/payments-page-loader";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function PaymentsRoute({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const [state, createOptionsState, currentUser, params] = await Promise.all([
    loadPaymentsPage(),
    loadCreatePaymentOptions(),
    getRequiredCurrentUser(),
    searchParams,
  ]);

  const canManagePayment = currentUser.permissions.includes(
    "can_manage_payments",
  );
  const initialCreateOpen = params?.create === "1" && canManagePayment;

  return (
    <PaymentsPage
      canCreatePayment={canManagePayment}
      canManagePayment={canManagePayment}
      cancelAction={cancelPaymentAction}
      createAction={createPaymentAction}
      createOptionsState={createOptionsState}
      initialCreateOpen={initialCreateOpen}
      markPaidAction={markPaidPaymentAction}
      state={state}
    />
  );
}
