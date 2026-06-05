import { generateAiDemoSummaryAction } from "@/features/ai-demo/ai-demo-summary-action";
import { AiDemoSummaryCard } from "@/features/ai-demo/ai-demo-summary-card";
import { isAiDemoEnabled } from "@/lib/ai/ai-demo-config";
import { getCurrentUser } from "@/lib/auth/current-user";

import { ExecutiveCommandOverview } from "./executive-command-overview";
import { loadExecutiveOverview } from "./overview-loader";

export async function ExecutiveOverviewPage() {
  const [state, currentUser] = await Promise.all([
    loadExecutiveOverview(),
    getCurrentUser().catch(() => null),
  ]);

  const canViewAiDemo =
    !!currentUser &&
    (currentUser.permissions.includes("can_view_appointments") ||
      currentUser.permissions.includes("can_view_payments"));

  return (
    <>
      <ExecutiveCommandOverview state={state} />
      <AiDemoSummaryCard
        action={generateAiDemoSummaryAction}
        canView={canViewAiDemo}
        enabled={isAiDemoEnabled()}
      />
    </>
  );
}
