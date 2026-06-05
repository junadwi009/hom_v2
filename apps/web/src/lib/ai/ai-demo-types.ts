import { z } from "zod";

/**
 * Aggregate is the ONLY shape that may reach the model. It contains counts and IDR
 * totals only — no client identities, contact, clinical, WhatsApp, notes, reasons,
 * payment references, or card/bank/gateway data.
 */
export const aiDemoAggregateSchema = z.object({
  appointmentsByStatus: z.record(z.string(), z.number().int().nonnegative()),
  upcomingAppointmentCount: z.number().int().nonnegative(),
  paymentsByStatus: z.record(z.string(), z.number().int().nonnegative()),
  paymentTotalsByStatusIdr: z.record(z.string(), z.number().int().nonnegative()),
  activePackageCount: z.number().int().nonnegative(),
  totalRemainingSessions: z.number().int().nonnegative(),
  lowSessionPackageCount: z.number().int().nonnegative(),
});

export type AiDemoAggregate = z.infer<typeof aiDemoAggregateSchema>;

const stringListSchema = z.preprocess((value) => {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list
    .map((item) => (typeof item === "string" ? item : String(item)))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 12);
}, z.array(z.string()));

export const aiDemoSummarySchema = z.object({
  summaryTitle: z.string().trim().min(1).max(160),
  appointmentSummary: z.string().trim().min(1).max(1200),
  packageSummary: z.string().trim().min(1).max(1200),
  paymentSummary: z.string().trim().min(1).max(1200),
  recommendedFollowUps: stringListSchema,
  riskNotes: stringListSchema,
  demoDisclaimer: z.string().trim().min(1).max(400),
});

export type AiDemoSummary = z.infer<typeof aiDemoSummarySchema>;

export type AiDemoSummaryState =
  | { status: "idle" }
  | { status: "disabled" }
  | { status: "unavailable"; message: string }
  | { status: "success"; summary: AiDemoSummary; model: string };

export type GenerateAiDemoSummaryFormAction = (
  state: AiDemoSummaryState,
  formData: FormData,
) => Promise<AiDemoSummaryState>;

export const initialAiDemoSummaryState: AiDemoSummaryState = { status: "idle" };

export const AI_DEMO_DISCLAIMER =
  "Demo operational AI summary — not official financial, legal, or medical advice.";

export const AI_DEMO_UNAVAILABLE_MESSAGE = "AI demo unavailable";
