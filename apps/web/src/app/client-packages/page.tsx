import { assignClientPackageAction } from "@/features/packages/client-packages/assign-client-package-action";
import { loadAssignClientPackageOptions } from "@/features/packages/client-packages/assign-client-package-options-loader";
import { ClientPackagesPage } from "@/features/packages/client-packages/client-packages-page";
import { loadClientPackagesPage } from "@/features/packages/client-packages/client-packages-page-loader";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function ClientPackagesRoute() {
  const [state, assignmentOptionsState, currentUser] = await Promise.all([
    loadClientPackagesPage(),
    loadAssignClientPackageOptions(),
    getRequiredCurrentUser(),
  ]);

  return (
    <ClientPackagesPage
      assignAction={assignClientPackageAction}
      assignmentOptionsState={assignmentOptionsState}
      canAssignPackage={currentUser.permissions.includes(
        "can_manage_client_packages",
      )}
      state={state}
    />
  );
}
