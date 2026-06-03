"use client";

import { Clock3, Plus, Search, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { toJakartaDateTimeLocalValue } from "./create-appointment-time";
import {
  initialCreateAppointmentActionState,
  type CreateAppointmentActionState,
  type CreateAppointmentFormAction,
  type CreateAppointmentOptionsState,
} from "./create-appointment-types";

type CreateAppointmentSheetProps = {
  optionsState: CreateAppointmentOptionsState;
  action?: CreateAppointmentFormAction;
  canCreateAppointment?: boolean;
  initialOpen?: boolean;
  previewState?: CreateAppointmentActionState;
  previewSubmitting?: boolean;
};

export function CreateAppointmentSheet({
  optionsState,
  action = blockedPreviewAction,
  canCreateAppointment = true,
  initialOpen = false,
  previewState,
  previewSubmitting = false,
}: CreateAppointmentSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [minimumStartTime, setMinimumStartTime] = useState("");
  const actionWithSuccess = useCallback(
    async (
      previousState: CreateAppointmentActionState,
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
    initialCreateAppointmentActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const selectedService =
    optionsState.status === "ready"
      ? optionsState.options.services.find(
          (service) => service.id === selectedServiceId,
        )
      : undefined;
  const canSubmit =
    optionsState.status === "ready" &&
    optionsState.dataMode === "supabase" &&
    canCreateAppointment &&
    !submitting;
  return (
    <>
      <Button
        disabled={!canCreateAppointment}
        type="button"
        title={
          canCreateAppointment
            ? undefined
            : "You do not have permission to create appointments."
        }
        onClick={() => {
          setMinimumStartTime(
            toJakartaDateTimeLocalValue(new Date(Date.now() + 60_000)),
          );
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" className="size-4" />
        New Appointment
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          Appointment created.
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close new appointment form"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby="new-appointment-title"
            aria-modal="true"
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Schedule
                </p>
                <h2
                  className="mt-1 text-xl font-semibold text-foreground"
                  id="new-appointment-title"
                >
                  New Appointment
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Create a scheduled appointment using studio-local time.
                </p>
              </div>
              <Button
                aria-label="Close appointment form"
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
                    <SearchableSelector
                      fieldId="create-appointment-client"
                      label="Client"
                      name="clientId"
                      options={optionsState.options.clients}
                    />
                    <SearchableSelector
                      fieldId="create-appointment-practitioner"
                      label="Practitioner"
                      name="practitionerId"
                      options={optionsState.options.practitioners}
                    />
                    <SearchableSelector
                      fieldId="create-appointment-service"
                      label="Service"
                      name="serviceId"
                      onChange={setSelectedServiceId}
                      options={optionsState.options.services}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-foreground">
                        <span>Start time</span>
                        <input
                          className={inputClassName}
                          id="create-appointment-start"
                          min={minimumStartTime}
                          name="startsAtLocal"
                          required
                          type="datetime-local"
                        />
                        <span className="block text-xs font-normal text-foreground-muted">
                          Asia/Jakarta timezone. Future times only.
                        </span>
                      </label>
                      <label className="space-y-2 text-sm font-medium text-foreground">
                        <span>Duration</span>
                        <span className="relative block">
                          <Clock3
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-3 size-4 text-foreground-muted"
                          />
                          <input
                            aria-label="Duration"
                            className={`${inputClassName} pl-9`}
                            readOnly
                            value={
                              selectedService
                                ? `${selectedService.durationMinutes} minutes`
                                : "Select a service"
                            }
                          />
                        </span>
                        <span className="block text-xs font-normal text-foreground-muted">
                          Copied from the selected service.
                        </span>
                      </label>
                    </div>
                    {displayState.status === "appointment_overlap" ? (
                      <CreateAppointmentFeedback state={displayState} />
                    ) : null}
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Source</span>
                      <input
                        className={inputClassName}
                        name="source"
                        readOnly
                        value="admin"
                      />
                      <span className="block text-xs font-normal text-foreground-muted">
                        Fixed for staff-created appointments.
                      </span>
                    </label>
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Operational summary</span>
                      <textarea
                        className={`${inputClassName} min-h-24 resize-y py-2`}
                        maxLength={280}
                        name="notesSummary"
                        placeholder="Optional non-clinical operational context"
                      />
                      <span className="block text-xs font-normal text-foreground-muted">
                        Optional. Maximum 280 characters. Do not enter clinical
                        notes.
                      </span>
                    </label>
                  </>
                ) : (
                  <OptionsErrorState status={optionsState.status} />
                )}
                {displayState.status !== "appointment_overlap" ? (
                  <CreateAppointmentFeedback state={displayState} />
                ) : null}
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
                  {submitting ? "Saving..." : "Create Appointment"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

type SearchableSelectorProps = {
  fieldId: string;
  label: string;
  name: string;
  options: { id: string; label: string }[];
  onChange?: (value: string) => void;
};

function SearchableSelector({
  fieldId,
  label,
  name,
  options,
  onChange,
}: SearchableSelectorProps) {
  const [query, setQuery] = useState("");
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  return (
    <div className="space-y-2">
      <label
        className="block text-sm font-medium text-foreground"
        htmlFor={fieldId}
      >
        {label}
      </label>
      <label className="relative block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 size-4 text-foreground-muted"
        />
        <span className="sr-only">Search {label.toLocaleLowerCase()}</span>
        <input
          aria-label={`Search ${label.toLocaleLowerCase()}`}
          className={`${inputClassName} pl-9`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${label.toLocaleLowerCase()}`}
          type="search"
          value={query}
        />
      </label>
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
        {filteredOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CreateAppointmentFeedback({
  state,
}: {
  state: CreateAppointmentActionState;
}) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Appointment could not be created. Try again."}
    </p>
  );
}

function OptionsErrorState({
  status,
}: {
  status: Exclude<CreateAppointmentOptionsState["status"], "ready">;
}) {
  const messageByStatus = {
    permission_denied: "You do not have permission to load appointment options.",
    configuration_error: "Local Supabase configuration is unavailable.",
    error: "Appointment options could not be loaded. Try again.",
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

async function blockedPreviewAction(): Promise<CreateAppointmentActionState> {
  return {
    status: "configuration_error",
    message: "Saving is unavailable in mock preview mode.",
  };
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";
