"use client";

import { Ban, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialCancelAppointmentActionState,
  type CancelAppointmentActionState,
  type CancelAppointmentFormAction,
} from "./cancel-appointment-types";

type CancelAppointmentDialogProps = {
  appointmentId: string;
  appointmentLabel: string;
  dataMode: "mock" | "supabase";
  action?: CancelAppointmentFormAction;
  canCancelAppointment?: boolean;
  initialOpen?: boolean;
  previewState?: CancelAppointmentActionState;
  previewSubmitting?: boolean;
};

export function CancelAppointmentDialog({
  appointmentId,
  appointmentLabel,
  dataMode,
  action = blockedPreviewAction,
  canCancelAppointment = true,
  initialOpen = false,
  previewState,
  previewSubmitting = false,
}: CancelAppointmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const actionWithSuccess = useCallback(
    async (
      previousState: CancelAppointmentActionState,
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
    initialCancelAppointmentActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const canSubmit =
    dataMode === "supabase" && canCancelAppointment && !submitting;

  return (
    <>
      <Button
        aria-label={`Cancel appointment for ${appointmentLabel}`}
        disabled={!canCancelAppointment}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Ban aria-hidden="true" className="size-3.5" />
        Cancel
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          Appointment cancelled.
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label="Close cancellation dialog"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={`cancel-appointment-title-${appointmentId}`}
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-lg border bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-red-700">
                  Schedule change
                </p>
                <h2
                  className="mt-1 text-lg font-semibold text-foreground"
                  id={`cancel-appointment-title-${appointmentId}`}
                >
                  Cancel appointment
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {appointmentLabel}
                </p>
              </div>
              <Button
                aria-label="Close cancel appointment form"
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
                    Preview mode: cancellation is disabled until local Supabase
                    data mode and an authenticated session are enabled.
                  </p>
                ) : null}
                <input name="id" type="hidden" value={appointmentId} />
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Cancellation reason</span>
                  <textarea
                    className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                    maxLength={280}
                    name="reason"
                    placeholder="Required operational reason"
                    required
                  />
                  <span className="block text-xs font-normal text-foreground-muted">
                    Required. Maximum 280 characters. Do not enter clinical
                    notes.
                  </span>
                </label>
                <CancelAppointmentFeedback state={displayState} />
              </div>
              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Keep Appointment
                </Button>
                <Button disabled={!canSubmit} type="submit">
                  {submitting ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function CancelAppointmentFeedback({
  state,
}: {
  state: CancelAppointmentActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Appointment could not be cancelled. Try again."}
    </p>
  );
}

async function blockedPreviewAction(): Promise<CancelAppointmentActionState> {
  return {
    status: "configuration_error",
    message: "Cancellation is unavailable in mock preview mode.",
  };
}
