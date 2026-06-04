"use client";

import { BadgeCheck, CircleSlash, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toJakartaDateTimeLocalValue } from "@/features/appointments/create-appointment-time";

import {
  initialPaymentTransitionActionState,
  type PaymentTransitionActionState,
  type PaymentTransitionFormAction,
} from "./payment-transition-types";

type PaymentTransitionKind = "mark_paid" | "cancel";

type PaymentTransitionDialogProps = {
  action?: PaymentTransitionFormAction;
  canManagePayment?: boolean;
  dataMode: "mock" | "supabase";
  initialOpen?: boolean;
  kind: PaymentTransitionKind;
  paymentId: string;
  paymentLabel: string;
  previewState?: PaymentTransitionActionState;
  previewSubmitting?: boolean;
};

export function PaymentTransitionDialog({
  action = blockedPreviewAction,
  canManagePayment = true,
  dataMode,
  initialOpen = false,
  kind,
  paymentId,
  paymentLabel,
  previewState,
  previewSubmitting = false,
}: PaymentTransitionDialogProps) {
  const router = useRouter();
  const copy = transitionCopy[kind];
  const [open, setOpen] = useState(initialOpen);
  const actionWithSuccess = useCallback(
    async (
      previousState: PaymentTransitionActionState,
      formData: FormData,
    ) => {
      const result = await action(previousState, formData);

      if (result.status === "success") {
        setOpen(false);
        router.refresh();
      }

      return result;
    },
    [action, router],
  );
  const [actionState, formAction, pending] = useActionState(
    actionWithSuccess,
    initialPaymentTransitionActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const canSubmit = dataMode === "supabase" && canManagePayment && !submitting;

  return (
    <>
      <Button
        aria-label={`${copy.buttonAriaLabel} for ${paymentLabel}`}
        disabled={!canManagePayment}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        {kind === "mark_paid" ? (
          <BadgeCheck aria-hidden="true" className="size-3.5" />
        ) : (
          <CircleSlash aria-hidden="true" className="size-3.5" />
        )}
        {copy.buttonLabel}
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          {copy.successMessage}
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label={`Close ${copy.dialogLabel.toLowerCase()} overlay`}
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={`payment-transition-title-${paymentId}`}
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-lg border bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Finance
                </p>
                <h2
                  className="mt-1 text-lg font-semibold text-foreground"
                  id={`payment-transition-title-${paymentId}`}
                >
                  {copy.dialogLabel}
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {paymentLabel}
                </p>
              </div>
              <Button
                aria-label={`Close ${copy.dialogLabel.toLowerCase()} dialog`}
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </header>
            <form action={formAction}>
              <div className="space-y-4 px-5 py-5">
                {dataMode === "mock" ? (
                  <p
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                    role="status"
                  >
                    Preview mode: {copy.previewAction} is disabled until local
                    Supabase data mode and an authenticated session are enabled.
                  </p>
                ) : null}
                <input name="paymentId" type="hidden" value={paymentId} />
                <p className="text-sm leading-6 text-foreground">
                  {copy.confirmationText}
                </p>
                {kind === "mark_paid" ? (
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Paid date and time</span>
                    <input
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                      defaultValue={toJakartaDateTimeLocalValue(new Date())}
                      name="paidAtLocal"
                      required
                      type="datetime-local"
                    />
                    <span className="block text-xs font-normal text-foreground-muted">
                      Asia/Jakarta studio time.
                    </span>
                  </label>
                ) : (
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Cancellation reason</span>
                    <textarea
                      className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                      maxLength={280}
                      name="reason"
                      placeholder="Short operational reason. No card, bank, or contact details."
                      required
                    />
                    <span className="block text-xs font-normal text-foreground-muted">
                      Maximum 280 characters. No card, bank, gateway, or contact
                      details.
                    </span>
                  </label>
                )}
                <PaymentTransitionFeedback state={displayState} />
              </div>
              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Keep Payment
                </Button>
                <Button disabled={!canSubmit} type="submit">
                  {submitting ? copy.submittingLabel : copy.confirmLabel}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PaymentTransitionFeedback({
  state,
}: {
  state: PaymentTransitionActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Payment status could not be changed. Try again."}
    </p>
  );
}

async function blockedPreviewAction(): Promise<PaymentTransitionActionState> {
  return {
    status: "configuration_error",
    message: "Payment status changes are unavailable in mock preview mode.",
  };
}

const transitionCopy = {
  mark_paid: {
    buttonAriaLabel: "Mark payment paid",
    buttonLabel: "Mark Paid",
    confirmLabel: "Confirm Paid",
    confirmationText:
      "Mark this pending payment as paid? This terminal status cannot be changed again in this phase.",
    dialogLabel: "Mark payment paid",
    previewAction: "marking paid",
    submittingLabel: "Saving...",
    successMessage: "Payment marked paid.",
  },
  cancel: {
    buttonAriaLabel: "Cancel payment",
    buttonLabel: "Cancel",
    confirmLabel: "Confirm Cancellation",
    confirmationText:
      "Cancel this pending payment? This terminal status cannot be changed again in this phase.",
    dialogLabel: "Cancel payment",
    previewAction: "cancellation",
    submittingLabel: "Cancelling...",
    successMessage: "Payment cancelled.",
  },
} as const;
