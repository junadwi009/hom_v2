"use client";

import { CheckCircle2, UserX, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type TerminalAppointmentActionState = {
  status:
    | "idle"
    | "success"
    | "appointment_unavailable"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "validation_error"
    | "unknown_error";
  message?: string;
  appointmentId?: string;
};

type TerminalAppointmentFormAction = (
  previousState: TerminalAppointmentActionState,
  formData: FormData,
) => Promise<TerminalAppointmentActionState>;

type TerminalAppointmentDialogProps = {
  action?: TerminalAppointmentFormAction;
  appointmentId: string;
  appointmentLabel: string;
  canManageAppointment?: boolean;
  dataMode: "mock" | "supabase";
  initialOpen?: boolean;
  kind: "complete" | "no_show";
  previewState?: TerminalAppointmentActionState;
  previewSubmitting?: boolean;
};

export function TerminalAppointmentDialog({
  action = blockedPreviewAction,
  appointmentId,
  appointmentLabel,
  canManageAppointment = true,
  dataMode,
  initialOpen = false,
  kind,
  previewState,
  previewSubmitting = false,
}: TerminalAppointmentDialogProps) {
  const router = useRouter();
  const copy = terminalCopy[kind];
  const [open, setOpen] = useState(initialOpen);
  const actionWithSuccess = useCallback(
    async (
      previousState: TerminalAppointmentActionState,
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
    initialTerminalAppointmentActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const canSubmit =
    dataMode === "supabase" && canManageAppointment && !submitting;

  return (
    <>
      <Button
        aria-label={`${copy.buttonAriaLabel} for ${appointmentLabel}`}
        disabled={!canManageAppointment}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        {kind === "complete" ? (
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
        ) : (
          <UserX aria-hidden="true" className="size-3.5" />
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
            aria-label={`Close ${copy.dialogLabel.toLowerCase()} dialog`}
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={`${kind}-appointment-title-${appointmentId}`}
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-lg border bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Terminal status
                </p>
                <h2
                  className="mt-1 text-lg font-semibold text-foreground"
                  id={`${kind}-appointment-title-${appointmentId}`}
                >
                  {copy.dialogLabel}
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {appointmentLabel}
                </p>
              </div>
              <Button
                aria-label={`Close ${copy.dialogLabel.toLowerCase()} form`}
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
                <input name="id" type="hidden" value={appointmentId} />
                <p className="text-sm leading-6 text-foreground">
                  {copy.confirmationText}
                </p>
                {kind === "no_show" ? (
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Optional no-show note</span>
                    <textarea
                      className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                      maxLength={280}
                      name="reason"
                      placeholder="Optional short operational note"
                    />
                    <span className="block text-xs font-normal text-foreground-muted">
                      Maximum 280 characters. Do not enter clinical notes.
                    </span>
                  </label>
                ) : null}
                <TerminalAppointmentFeedback state={displayState} />
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

function TerminalAppointmentFeedback({
  state,
}: {
  state: TerminalAppointmentActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Appointment status could not be changed. Try again."}
    </p>
  );
}

async function blockedPreviewAction(): Promise<TerminalAppointmentActionState> {
  return {
    status: "configuration_error",
    message: "Terminal status changes are unavailable in mock preview mode.",
  };
}

const initialTerminalAppointmentActionState: TerminalAppointmentActionState = {
  status: "idle",
};

const terminalCopy = {
  complete: {
    buttonAriaLabel: "Complete appointment",
    buttonLabel: "Complete",
    confirmLabel: "Confirm Completion",
    confirmationText:
      "Mark this appointment completed? This terminal status cannot be changed again in this phase.",
    dialogLabel: "Complete appointment",
    previewAction: "completion",
    submittingLabel: "Completing...",
    successMessage: "Appointment marked completed.",
  },
  no_show: {
    buttonAriaLabel: "Mark no-show",
    buttonLabel: "Mark No-show",
    confirmLabel: "Confirm No-show",
    confirmationText:
      "Mark this appointment no-show? This terminal status cannot be changed again in this phase.",
    dialogLabel: "Mark appointment no-show",
    previewAction: "no-show marking",
    submittingLabel: "Marking...",
    successMessage: "Appointment marked no-show.",
  },
} as const;
