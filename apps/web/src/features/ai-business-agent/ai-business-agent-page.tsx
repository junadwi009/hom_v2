import { DashboardCard } from "@/components/hom/dashboard-card";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { PageHeader } from "@/components/layout/page-header";

import { AiBusinessAgentChat } from "./ai-business-agent-chat";

export function AiBusinessAgentPage({
  canUse,
  source,
}: {
  canUse: boolean;
  source: "mock" | "supabase";
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Management"
        title="AI Business Agent"
        description="Tanya jawab internal yang dijawab dari knowledge base yang sudah dipublish."
      />

      {source === "mock" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Mode preview (mock). Agent aktif saat data mode = supabase.
        </div>
      ) : null}

      {!canUse ? (
        <PermissionDeniedState />
      ) : (
        <DashboardCard
          description="Jawaban selalu mengutip sumber & lewat policy guard."
          title="Assistant"
        >
          <AiBusinessAgentChat />
        </DashboardCard>
      )}
    </div>
  );
}
