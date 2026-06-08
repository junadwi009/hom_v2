import { createLeadAction } from "@/features/clients/leads/create-lead-action";
import { LeadsPage } from "@/features/clients/leads/leads-page";
import { loadRealLeads } from "@/features/clients/leads/leads-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [realLeads, currentUser] = await Promise.all([
    loadRealLeads(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_clients"),
  );

  return (
    <LeadsPage
      canCreate={canCreate}
      createAction={createLeadAction}
      realLeads={realLeads}
    />
  );
}
