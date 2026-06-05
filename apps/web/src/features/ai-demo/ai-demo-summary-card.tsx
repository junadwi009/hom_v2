"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";

import { DashboardCard } from "@/components/hom/dashboard-card";
import { Button } from "@/components/ui/button";
import {
  AI_DEMO_DISCLAIMER,
  initialAiDemoSummaryState,
  type AiDemoSummary,
  type AiDemoSummaryState,
  type GenerateAiDemoSummaryFormAction,
} from "@/lib/ai/ai-demo-types";

type AiDemoSummaryCardProps = {
  enabled?: boolean;
  canView?: boolean;
  action?: GenerateAiDemoSummaryFormAction;
  previewState?: AiDemoSummaryState;
  previewSubmitting?: boolean;
};

export function AiDemoSummaryCard({
  enabled = false,
  canView = false,
  action = disabledPreviewAction,
  previewState,
  previewSubmitting = false,
}: AiDemoSummaryCardProps) {
  const [actionState, formAction, pending] = useActionState(
    action,
    initialAiDemoSummaryState,
  );
  const displayState = previewState ?? actionState;
  const submitting = previewSubmitting || pending;
  const available = enabled && canView;

  return (
    <DashboardCard
      title="AI Demo Summary"
      description="Demo-only operational insight generated from aggregate counts. Read-only; no records are changed."
    >
      {available ? (
        <form action={formAction} className="space-y-4">
          <Button disabled={submitting} type="submit">
            <Sparkles aria-hidden="true" className="size-4" />
            {submitting ? "Generating..." : "Generate Demo Insight"}
          </Button>
          {displayState.status === "success" ? (
            <AiDemoSummaryResult
              model={displayState.model}
              summary={displayState.summary}
            />
          ) : null}
          {displayState.status === "unavailable" ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
              role="alert"
            >
              AI demo unavailable. Please try again later.
            </p>
          ) : null}
        </form>
      ) : (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950"
          role="status"
        >
          {enabled
            ? "You do not have permission to use the AI demo summary."
            : "AI demo summary is disabled for this environment."}
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-foreground-muted">
        {AI_DEMO_DISCLAIMER}
      </p>
    </DashboardCard>
  );
}

function AiDemoSummaryResult({
  summary,
  model,
}: {
  summary: AiDemoSummary;
  model: string;
}) {
  return (
    <div className="space-y-4 rounded-md border bg-background px-4 py-4">
      <h3 className="text-base font-semibold text-foreground">
        {summary.summaryTitle}
      </h3>
      <SummarySection label="Appointments" text={summary.appointmentSummary} />
      <SummarySection label="Packages & sessions" text={summary.packageSummary} />
      <SummarySection label="Payments" text={summary.paymentSummary} />
      <SummaryList label="Recommended follow-ups" items={summary.recommendedFollowUps} />
      <SummaryList label="Risk notes" items={summary.riskNotes} />
      <p className="text-xs leading-5 text-foreground-muted">
        {summary.demoDisclaimer}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-foreground-muted">
        Model: {model}
      </p>
    </div>
  );
}

function SummarySection({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground">{text}</p>
    </div>
  );
}

function SummaryList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground">
        {items.map((item, index) => (
          <li key={`${label}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

async function disabledPreviewAction(): Promise<AiDemoSummaryState> {
  return { status: "disabled" };
}
