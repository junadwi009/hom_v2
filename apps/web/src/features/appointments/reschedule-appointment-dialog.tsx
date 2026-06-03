"use client";

import { CalendarClock, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { toJakartaDateTimeLocalValue } from "./create-appointment-time";
import {
  initialRescheduleAppointmentActionState,
  type RescheduleAppointmentActionState,
  type RescheduleAppointmentFormAction,
} from "./reschedule-appointment-types";

type RescheduleAppointmentDialogProps = {
  appointmentId: string;
  appointmentLabel: string;
  duration: string;
  dataMode: "mock" | "supabase";
  action?: RescheduleAppointmentFormAction;
  canRescheduleAppointment?: boolean;
  initialOpen?: boolean;
  previewState?: RescheduleAppointmentActionState;
  previewSubmitting?: boolean;
};

export function RescheduleAppointmentDialog({
  appointmentId,
  appointmentLabel,
  duration,
  dataMode,
  action = blockedPreviewAction,
  canRescheduleAppointment = true,
  initialOpen = false,
  previewState,
  previewSubmitting = false,
}: RescheduleAppointmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [minimumStartTime, setMinimumStartTime] = useState("");
  const actionWithSuccess = useCallback(
    async (
      previousState: RescheduleAppointmentActionState,
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
    initialRescheduleAppointmentActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const canSubmit =
    dataMode === "supabase" && canRescheduleAppointment && !submitting;

  return (
    <>
      <Button
        aria-label={`Reschedule appointment for ${appointmentLabel}`}
        disabled={!canRescheduleAppointment}
        onClick={() => {
          setMinimumStartTime(
            toJakartaDateTimeLocalValue(new Date(Date.now() + 60_000)),
          );
          setOpen(true);
        }}
        size="sm"
        type="button"
        variant="secondary"
      >
        <CalendarClock aria-hidden="true" className="size-3.5" />
        Reschedule
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          Appointment rescheduled.
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label="Close reschedule dialog"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={`reschedule-appointment-title-${appointmentId}`}
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-lg border bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Schedule change
                </p>
                <h2
                  className="mt-1 text-lg font-semibold text-foreground"
                  id={`reschedule-appointment-title-${appointmentId}`}
                >
                  Reschedule appointment
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {appointmentLabel}
                </p>
              </div>
              <Button
                aria-label="Close reschedule appointment form"
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
                    Preview mode: rescheduling is disabled until local Supabase
                    data mode and an authenticated session are enabled.
                  </p>
                ) : null}
                <input name="id" type="hidden" value={appointmentId} />
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>New start time</span>
                  <input
                    className={inputClassName}
                    min={minimumStartTime}
                    name="startsAtLocal"
                    required
                    type="datetime-local"
                  />
                  <span className="block text-xs font-normal text-foreground-muted">
                    Asia/Jakarta timezone. Future times only.
                  </span>
                </label>
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Duration</span>
                  <input
                    aria-label="Reschedule duration"
                    className={inputClassName}
                    readOnly
                    value={duration}
                  />
                  <span className="block text-xs font-normal text-foreground-muted">
                    Preserved from the existing appointment.
                  </span>
                </label>
                {displayState.status === "appointment_overlap" ? (
                  <RescheduleAppointmentFeedback state={displayState} />
                ) : null}
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Reschedule reason</span>
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
                {displayState.status !== "appointment_overlap" ? (
                  <RescheduleAppointmentFeedback state={displayState} />
                ) : null}
              </div>
              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Keep Current Time
                </Button>
                <Button disabled={!canSubmit} type="submit">
                  {submitting ? "Rescheduling..." : "Confirm Reschedule"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function RescheduleAppointmentFeedback({
  state,
}: {
  state: RescheduleAppointmentActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Appointment could not be rescheduled. Try again."}
    </p>
  );
}

async function blockedPreviewAction(): Promise<RescheduleAppointmentActionState> {
  return {
    status: "configuration_error",
    message: "Rescheduling is unavailable in mock preview mode.",
  };
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted";
