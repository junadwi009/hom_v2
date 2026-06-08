import { ClientManagementPage } from "@/features/clients/management/client-management-page";
import { createClientAction } from "@/features/clients/management/create-client-action";
import { loadRealManagedClients } from "@/features/clients/management/managed-clients-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [realClients, currentUser] = await Promise.all([
    loadRealManagedClients(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_clients"),
  );

  return (
    <ClientManagementPage
      canCreate={canCreate}
      createAction={createClientAction}
      realClients={realClients}
    />
  );
}
