import { cancelPaymentAction } from "@/features/payments/cancel-payment-action";
import { createPaymentAction } from "@/features/payments/create-payment-action";
import { loadCreatePaymentOptions } from "@/features/payments/create-payment-options-loader";
import { markPaidPaymentAction } from "@/features/payments/mark-paid-payment-action";
import { PaymentsPage } from "@/features/payments/payments-page";
import { loadPaymentsPage } from "@/features/payments/payments-page-loader";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function PaymentsRoute() {
  const [state, createOptionsState, currentUser] = await Promise.all([
    loadPaymentsPage(),
    loadCreatePaymentOptions(),
    getRequiredCurrentUser(),
  ]);

  const canManagePayment = currentUser.permissions.includes(
    "can_manage_payments",
  );

  return (
    <PaymentsPage
      canCreatePayment={canManagePayment}
      canManagePayment={canManagePayment}
      cancelAction={cancelPaymentAction}
      createAction={createPaymentAction}
      createOptionsState={createOptionsState}
      markPaidAction={markPaidPaymentAction}
      state={state}
    />
  );
}
