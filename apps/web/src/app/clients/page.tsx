import { ClientManagementPage } from "@/features/clients/management/client-management-page";
import { createClientAction } from "@/features/clients/management/create-client-action";
import { loadManagementKpis } from "@/features/clients/management/management-kpis-loader";
import { loadRealManagedClients } from "@/features/clients/management/managed-clients-loader";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDataMode } from "@/lib/env/app-mode";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [realClients, kpis, currentUser] = await Promise.all([
    loadRealManagedClients(),
    loadManagementKpis(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_clients"),
  );

  return (
    <ClientManagementPage
      canCreate={canCreate}
      createAction={createClientAction}
      dataSource={getDataMode() === "supabase" ? "supabase" : "mock"}
      kpis={kpis}
      realClients={realClients}
    />
  );
}
