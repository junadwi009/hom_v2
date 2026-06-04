"use client";

import { MinusCircle, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  initialDeductSessionActionState,
  toDeductSessionPreview,
  type DeductSessionActionState,
  type DeductSessionFormAction,
  type DeductSessionOptionsState,
  type DeductSessionPackageOption,
} from "./deduct-session-types";

type DeductSessionDialogProps = {
  action?: DeductSessionFormAction;
  appointmentId: string;
  appointmentLabel: string;
  canDeductSession?: boolean;
  dataMode: "mock" | "supabase";
  initialOpen?: boolean;
  optionsState: DeductSessionOptionsState;
  previewState?: DeductSessionActionState;
  previewSubmitting?: boolean;
};

export function DeductSessionDialog({
  action = blockedPreviewAction,
  appointmentId,
  appointmentLabel,
  canDeductSession = true,
  dataMode,
  initialOpen = false,
  optionsState,
  previewState,
  previewSubmitting = false,
}: DeductSessionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const actionWithSuccess = useCallback(
    async (
      previousState: DeductSessionActionState,
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
    initialDeductSessionActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;

  const ready = optionsState.status === "ready";
  const alreadyDeducted = ready && optionsState.alreadyDeducted;
  const packages = ready ? optionsState.packages : [];
  const hasEligiblePackage = packages.length > 0;
  const selectedPackage = packages.find(
    (packageOption) => packageOption.id === selectedPackageId,
  );
  const canSubmit =
    ready &&
    dataMode === "supabase" &&
    canDeductSession &&
    !alreadyDeducted &&
    hasEligiblePackage &&
    Boolean(selectedPackage) &&
    !submitting;
  const deductionDisabled = !canDeductSession || alreadyDeducted;

  return (
    <>
      <Button
        aria-label={`Deduct session for ${appointmentLabel}`}
        disabled={deductionDisabled}
        onClick={() => setOpen(true)}
        size="sm"
        title={
          alreadyDeducted
            ? "This appointment has already deducted a session."
            : canDeductSession
              ? undefined
              : "You do not have permission to deduct sessions."
        }
        type="button"
        variant="secondary"
      >
        <MinusCircle aria-hidden="true" className="size-3.5" />
        {alreadyDeducted ? "Session Deducted" : "Deduct Session"}
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          Session deducted.
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label="Close deduct session dialog"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby={`deduct-session-title-${appointmentId}`}
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-lg border bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Membership
                </p>
                <h2
                  className="mt-1 text-lg font-semibold text-foreground"
                  id={`deduct-session-title-${appointmentId}`}
                >
                  Deduct Session
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {appointmentLabel}
                </p>
              </div>
              <Button
                aria-label="Close deduct session form"
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
                <input name="appointmentId" type="hidden" value={appointmentId} />
                {ready ? (
                  <>
                    {dataMode === "mock" ? (
                      <p
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                        role="status"
                      >
                        Preview mode: deduction is disabled until local Supabase
                        data mode and an authenticated session are enabled.
                      </p>
                    ) : null}
                    {alreadyDeducted ? (
                      <p
                        className="rounded-md border bg-stone-50 px-3 py-2 text-sm leading-6 text-foreground"
                        role="status"
                      >
                        This appointment has already deducted a session. Only one
                        deduction is allowed per appointment.
                      </p>
                    ) : !hasEligiblePackage ? (
                      <p
                        className="rounded-md border bg-stone-50 px-3 py-2 text-sm leading-6 text-foreground"
                        role="status"
                      >
                        No eligible active package for this client. Assign an
                        active package before deducting a session.
                      </p>
                    ) : (
                      <>
                        <label className="block space-y-2 text-sm font-medium text-foreground">
                          <span>Package</span>
                          <select
                            className={inputClassName}
                            defaultValue=""
                            name="clientPackageId"
                            onChange={(event) =>
                              setSelectedPackageId(event.target.value)
                            }
                            required
                          >
                            <option disabled value="">
                              Select package
                            </option>
                            {packages.map((packageOption) => (
                              <option
                                key={packageOption.id}
                                value={packageOption.id}
                              >
                                {packageOption.packageName} (
                                {packageOption.remainingSessions} left)
                              </option>
                            ))}
                          </select>
                        </label>
                        <DeductSessionPreviewPanel
                          selectedPackage={selectedPackage}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <OptionsErrorState status={optionsState.status} />
                )}
                <DeductSessionFeedback state={displayState} />
              </div>
              <footer className="flex items-center justify-end gap-3 border-t px-5 py-4">
                <Button
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Close
                </Button>
                <Button disabled={!canSubmit} type="submit">
                  {submitting ? "Deducting..." : "Deduct Session"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function DeductSessionPreviewPanel({
  selectedPackage,
}: {
  selectedPackage: DeductSessionPackageOption | undefined;
}) {
  const before = selectedPackage
    ? String(selectedPackage.remainingSessions)
    : "Select a package";
  const after = selectedPackage
    ? String(toDeductSessionPreview(selectedPackage.remainingSessions).after)
    : "Select a package";
  const expiry = selectedPackage
    ? toExpiryDateLabel(selectedPackage.expiresAt)
    : "Select a package";

  return (
    <div className="rounded-md border bg-stone-50 px-4 py-4">
      <p className="text-sm font-semibold text-foreground">Deduction Preview</p>
      {selectedPackage ? (
        <p className="mt-1 text-sm text-foreground-muted">
          {selectedPackage.packageName}
        </p>
      ) : null}
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-foreground-muted">Remaining Before</dt>
          <dd className="mt-1 font-medium text-foreground">{before}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Remaining After</dt>
          <dd className="mt-1 font-medium text-foreground">{after}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Expires</dt>
          <dd className="mt-1 font-medium text-foreground">{expiry}</dd>
        </div>
      </dl>
    </div>
  );
}

function DeductSessionFeedback({
  state,
}: {
  state: DeductSessionActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Session could not be deducted. Try again."}
    </p>
  );
}

function OptionsErrorState({
  status,
}: {
  status: Exclude<DeductSessionOptionsState["status"], "ready">;
}) {
  const messageByStatus = {
    permission_denied:
      "You do not have permission to load deduction options.",
    configuration_error: "Local Supabase configuration is unavailable.",
    error: "Deduction options could not be loaded. Try again.",
  };

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {messageByStatus[status]}
    </p>
  );
}

export function toExpiryDateLabel(expiresAt: string) {
  const time = Date.parse(expiresAt);

  if (Number.isNaN(time)) {
    return expiresAt;
  }

  return new Date(time).toISOString().slice(0, 10);
}

async function blockedPreviewAction(): Promise<DeductSessionActionState> {
  return {
    status: "configuration_error",
    message: "Deduction is unavailable in mock preview mode.",
  };
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";
