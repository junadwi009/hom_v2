"use client";

import { CalendarClock, CreditCard, X } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toJakartaDateTimeLocalValue } from "@/features/appointments/create-appointment-time";

import {
  initialCreatePaymentActionState,
  type CreatePaymentActionState,
  type CreatePaymentFormAction,
  type CreatePaymentOptionsState,
} from "./create-payment-types";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "e_wallet", label: "E-wallet" },
  { value: "other", label: "Other" },
];

type CreatePaymentSheetProps = {
  action?: CreatePaymentFormAction;
  canCreatePayment?: boolean;
  initialOpen?: boolean;
  optionsState: CreatePaymentOptionsState;
  previewState?: CreatePaymentActionState;
  previewSubmitting?: boolean;
};

export function CreatePaymentSheet({
  action = blockedPreviewAction,
  canCreatePayment = true,
  initialOpen = false,
  optionsState,
  previewState,
  previewSubmitting = false,
}: CreatePaymentSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const actionWithSuccess = useCallback(
    async (previousState: CreatePaymentActionState, formData: FormData) => {
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
    initialCreatePaymentActionState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const ready = optionsState.status === "ready";
  const clientPackages =
    optionsState.status === "ready"
      ? optionsState.options.clientPackages.filter(
          (clientPackage) => clientPackage.clientId === selectedClientId,
        )
      : [];
  const canSubmit =
    ready &&
    optionsState.dataMode === "supabase" &&
    canCreatePayment &&
    !submitting;

  return (
    <>
      <Button
        disabled={!canCreatePayment}
        onClick={() => {
          setSelectedClientId("");
          setSelectedStatus("pending");
          setOpen(true);
        }}
        title={
          canCreatePayment
            ? undefined
            : "You do not have permission to create payments."
        }
        type="button"
      >
        <CreditCard aria-hidden="true" className="size-4" />
        Create Payment
      </Button>
      {displayState.status === "success" ? (
        <p
          className="fixed bottom-5 right-5 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg"
          role="status"
        >
          Payment created.
        </p>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close create payment form"
            className="absolute inset-0 bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section
            aria-labelledby="create-payment-title"
            aria-modal="true"
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l bg-background-card shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                  Finance
                </p>
                <h2
                  className="mt-1 text-xl font-semibold text-foreground"
                  id="create-payment-title"
                >
                  Create Payment
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Record a manual payment for an eligible client.
                </p>
              </div>
              <Button
                aria-label="Close create payment dialog"
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
                {ready ? (
                  <>
                    {optionsState.dataMode === "mock" ? (
                      <p
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
                        role="status"
                      >
                        Preview mode: saving is disabled until local Supabase data
                        mode and an authenticated session are enabled.
                      </p>
                    ) : null}
                    <Selector
                      label="Client"
                      name="clientId"
                      onChange={(value) => setSelectedClientId(value)}
                      options={optionsState.options.clients}
                      required
                    />
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Client package (optional)</span>
                      <select
                        className={inputClassName}
                        defaultValue=""
                        key={selectedClientId}
                        name="clientPackageId"
                      >
                        <option value="">No linked package</option>
                        {clientPackages.map((clientPackage) => (
                          <option
                            key={clientPackage.id}
                            value={clientPackage.id}
                          >
                            {clientPackage.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Amount (IDR)</span>
                      <input
                        className={inputClassName}
                        inputMode="numeric"
                        min={1}
                        name="amountIdr"
                        required
                        step={1}
                        type="number"
                      />
                    </label>
                    <Selector
                      label="Payment method"
                      name="paymentMethod"
                      options={PAYMENT_METHODS.map((method) => ({
                        id: method.value,
                        label: method.label,
                      }))}
                      required
                    />
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Status</span>
                      <select
                        className={inputClassName}
                        name="status"
                        onChange={(event) =>
                          setSelectedStatus(event.target.value)
                        }
                        value={selectedStatus}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </label>
                    {selectedStatus === "paid" ? (
                      <label className="block space-y-2 text-sm font-medium text-foreground">
                        <span>Paid date and time</span>
                        <span className="relative block">
                          <CalendarClock
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-3 size-4 text-foreground-muted"
                          />
                          <input
                            className={`${inputClassName} pl-9`}
                            defaultValue={toJakartaDateTimeLocalValue(
                              new Date(),
                            )}
                            name="paidAtLocal"
                            required
                            type="datetime-local"
                          />
                        </span>
                        <span className="block text-xs font-normal text-foreground-muted">
                          Asia/Jakarta studio time. Required for paid payments.
                        </span>
                      </label>
                    ) : null}
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Reference number (optional)</span>
                      <input
                        className={inputClassName}
                        maxLength={64}
                        name="referenceNumber"
                        placeholder="Safe operational reference only"
                        type="text"
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-medium text-foreground">
                      <span>Notes (optional)</span>
                      <textarea
                        className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
                        maxLength={280}
                        name="notes"
                        placeholder="Safe operational note. No card, bank, or contact details."
                      />
                      <span className="block text-xs font-normal text-foreground-muted">
                        Maximum 280 characters. No card, bank, gateway, or contact
                        details.
                      </span>
                    </label>
                  </>
                ) : (
                  <OptionsErrorState status={optionsState.status} />
                )}
                <CreatePaymentFeedback state={displayState} />
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
                  {submitting ? "Saving..." : "Create Payment"}
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
  label: string;
  name: string;
  options: { id: string; label: string }[];
  onChange?: (value: string) => void;
  required?: boolean;
};

function Selector({ label, name, onChange, options, required }: SelectorProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      <select
        className={inputClassName}
        defaultValue=""
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
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

function CreatePaymentFeedback({ state }: { state: CreatePaymentActionState }) {
  if (state.status === "idle" || state.status === "success") {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
      role="alert"
    >
      {state.message ?? "Payment could not be created. Try again."}
    </p>
  );
}

function OptionsErrorState({
  status,
}: {
  status: Exclude<CreatePaymentOptionsState["status"], "ready">;
}) {
  const messageByStatus = {
    permission_denied:
      "You do not have permission to load payment options.",
    configuration_error: "Local Supabase configuration is unavailable.",
    error: "Payment options could not be loaded. Try again.",
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

async function blockedPreviewAction(): Promise<CreatePaymentActionState> {
  return {
    status: "configuration_error",
    message: "Saving is unavailable in mock preview mode.",
  };
}

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:cursor-not-allowed disabled:opacity-60";
