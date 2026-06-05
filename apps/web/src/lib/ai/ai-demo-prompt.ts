import { type AiDemoAggregate } from "./ai-demo-types";

export type AiDemoChatMessage = {
  role: "system" | "user";
  content: string;
};

const SYSTEM_PROMPT = [
  "You are a presentation assistant for a wellness studio operations dashboard.",
  "You receive ONLY aggregated, non-identifying demo operational counts.",
  "This is demo operational data, not real customer data.",
  "Rules:",
  "- Do not invent exact client identities, names, or contact details.",
  "- Do not provide financial, legal, or medical advice.",
  "- Keep the output concise and presentation-friendly.",
  "- Write in Indonesian (Bahasa Indonesia) unless the app locale clearly indicates otherwise.",
  "Return ONLY a strict JSON object with exactly these keys:",
  "summaryTitle, appointmentSummary, packageSummary, paymentSummary, recommendedFollowUps, riskNotes, demoDisclaimer.",
  "recommendedFollowUps and riskNotes must be arrays of short strings.",
  "demoDisclaimer must state this is a demo operational summary, not official financial, legal, or medical advice.",
].join("\n");

/**
 * Re-projects the aggregate through an explicit allowlist so nothing beyond the safe
 * counts/totals can ever reach the model, then returns the chat messages.
 */
export function buildAiDemoMessages(
  aggregate: AiDemoAggregate,
): AiDemoChatMessage[] {
  const safeAggregate = {
    appointmentsByStatus: aggregate.appointmentsByStatus,
    upcomingAppointmentCount: aggregate.upcomingAppointmentCount,
    paymentsByStatus: aggregate.paymentsByStatus,
    paymentTotalsByStatusIdr: aggregate.paymentTotalsByStatusIdr,
    activePackageCount: aggregate.activePackageCount,
    totalRemainingSessions: aggregate.totalRemainingSessions,
    lowSessionPackageCount: aggregate.lowSessionPackageCount,
  };

  const userPrompt = [
    "Demo operational aggregates (counts and IDR totals only, no identities):",
    JSON.stringify(safeAggregate),
    "Summarize appointments, packages/sessions, and payments, then list practical follow-ups and risk notes.",
  ].join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];
}
