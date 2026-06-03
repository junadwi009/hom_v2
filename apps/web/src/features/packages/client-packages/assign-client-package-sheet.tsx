"use client";

import { CalendarClock, PackagePlus, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  toJakartaDateTimeLocalValue,
  toJakartaIsoTimestamp,
} from "@/features/appointments/create-appointment-time";

import {
  initialAssignClientPackageActionState,
  type AssignClientPackageActionState,
  type AssignClientPackageFormAction,
  type AssignClientPackageOptionsState,
  type AssignClientPackagePackageOption,
} from "./assign-client-package-types";

type AssignClientPackageSheetProps = {
  action?: AssignClientPackageFormAction;
  canAssignPackage?: boolean;
  initialOpen?: boolean;
  optionsState: AssignClientPackageOptionsState;
  previewState?: AssignClientPackageActionState;
  previewSubmitting?: boolean;
};

export function AssignClientPackageSheet({
  action = blockedPreviewAction,
  canAssignPackage = true,
  initialOpen = false,
  optionsState,
  previewState,
  previewSubmitting = false,
}: AssignClientPackageSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [purchasedAtLocal, setPurchasedAtLocal] = useState("");
  const actionWithSuccess = useCallback(
    async (
      previousState: AssignClientPackageActionState,
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
    initialAssignClientPackageActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const selectedPackage =
    optionsState.status === "ready"
      ? optionsState.options.packages.find(
          (packageOption) => packageOption.id === selectedPackageId,
        )
      : undefined;
  const canSubmit =
    optionsState.status === "ready" &&
    optionsState.dataMode === "supabase" &&
    canAssignPackage &&
    !submitting;
  const expiryPreview =
    selectedPackage && purchasedAtLocal
      ? calculateExpiryDateLabel(purchasedAtLocal, selectedPackage.validityDays)
      : "Select package and purchase date";

  return (
    <>
      <Button
        disabled={!canAssignPackage}
        onClick={() => {
          setPurchasedAtLocal(toJakartaDateTimeLocalValue(new Date()));
          setOpen(true);
        }}
        title={
          canAssignPackage
            ? undefined
            : "You do not have permission to assign packages."
        }
        type="button"
      >
        <PackagePlus aria-hidden="true" className="size-4" />
        Assign Package
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          Package assigned.
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close assign package form"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby="assign-package-title"
            aria-modal="true"
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Membership
                </p>
                <h2
                  className="mt-1 text-xl font-semibold text-foreground"
                  id="assign-package-title"
                >
                  Assign Package
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Assign an active package to an eligible client.
                </p>
              </div>
              <Button
                aria-label="Close package assignment form"
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </header>
            <form action={formAction} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-5 py-5">
                {optionsState.status === "ready" ? (
                  <>
                    {optionsState.dataMode === "mock" ? (
                      <p
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                        role="status"
                      >
                        Preview mode: saving is disabled until local Supabase
                        data mode and an authenticated session are enabled.
                      </p>
                    ) : null}
                    <Selector
                      fieldId="assign-package-client"
                      label="Client"
                      name="clientId"
                      options={optionsState.options.clients}
                    />
                    <Selector
                      fieldId="assign-package-package"
                      label="Package"
                      name="packageId"
                      onChange={setSelectedPackageId}
                      options={optionsState.options.packages}
                    />
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Purchase date and time</span>
                      <span className="relative block">
                        <CalendarClock
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-3 size-4 text-foreground-muted"
                        />
                        <input
                          className={`${inputClassName} pl-9`}
                          name="purchasedAtLocal"
                          onChange={(event) =>
                            setPurchasedAtLocal(event.target.value)
                          }
                          required
                          type="datetime-local"
                          value={purchasedAtLocal}
                        />
                      </span>
                      <span className="block text-xs font-normal text-foreground-muted">
                        Asia/Jakarta studio time.
                      </span>
                    </label>
                    <AssignmentPreview
                      expiryPreview={expiryPreview}
                      selectedPackage={selectedPackage}
                    />
                  </>
                ) : (
                  <OptionsErrorState status={optionsState.status} />
                )}
                <AssignClientPackageFeedback state={displayState} />
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
                  {submitting ? "Saving..." : "Assign Package"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

type SelectorProps = {
  fieldId: string;
  label: string;
  name: string;
  options: { id: string; label: string }[];
  onChange?: (value: string) => void;
};

function Selector({ fieldId, label, name, onChange, options }: SelectorProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <select
        className={inputClassName}
        defaultValue=""
        id={fieldId}
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        required
      >
        <option disabled value="">
          Select {label.toLocaleLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AssignmentPreview({
  expiryPreview,
  selectedPackage,
}: {
  expiryPreview: string;
  selectedPackage: AssignClientPackagePackageOption | undefined;
}) {
  const totalSessions = selectedPackage
    ? String(selectedPackage.totalSessions)
    : "Select a package";

  return (
    <div className="rounded-md border bg-stone-50 px-4 py-4">
      <p className="text-sm font-semibold text-foreground">Assignment Preview</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-foreground-muted">Total Sessions</dt>
          <dd className="mt-1 font-medium text-foreground">{totalSessions}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Starting Remaining</dt>
          <dd className="mt-1 font-medium text-foreground">{totalSessions}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Expires</dt>
          <dd className="mt-1 font-medium text-foreground">{expiryPreview}</dd>
        </div>
      </dl>
    </div>
  );
}

function AssignClientPackageFeedback({
  state,
}: {
  state: AssignClientPackageActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Package could not be assigned. Try again."}
    </p>
  );
}

function OptionsErrorState({
  status,
}: {
  status: Exclude<AssignClientPackageOptionsState["status"], "ready">;
}) {
  const messageByStatus = {
    permission_denied:
      "You do not have permission to load package assignment options.",
    configuration_error: "Local Supabase configuration is unavailable.",
    error: "Package assignment options could not be loaded. Try again.",
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

export function calculateExpiryDateLabel(
  purchasedAtLocal: string,
  validityDays: number,
) {
  const purchasedAt = toJakartaIsoTimestamp(purchasedAtLocal);

  if (!purchasedAt) {
    return "Choose purchase date";
  }

  return new Date(
    Date.parse(purchasedAt) + validityDays * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
}

async function blockedPreviewAction(): Promise<AssignClientPackageActionState> {
  return {
    status: "configuration_error",
    message: "Saving is unavailable in mock preview mode.",
  };
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";
