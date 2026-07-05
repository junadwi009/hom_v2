import { ExecutiveOverviewPage } from "@/features/executive-command/executive-overview-page";

export const dynamic = "force-dynamic";

// The landing page renders the real, Supabase-backed owner cockpit
// (KPI + Revenue vs New Clients chart + honest empty/unavailable states).
// The presentational DecisionOverviewPage (hardcoded demo numbers) is
// intentionally no longer mounted here — see docs/PHASE_UX1_FRONTEND_HONESTY_PLAN.md.
export default function Home() {
  return <ExecutiveOverviewPage />;
}
