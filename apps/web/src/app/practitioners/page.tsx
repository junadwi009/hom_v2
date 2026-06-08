import { createPractitionerAction } from "@/features/catalog/practitioners/create-practitioner-action";
import { PractitionersCatalogPage } from "@/features/catalog/practitioners/practitioners-catalog-page";
import { loadPractitionersCatalogPage } from "@/features/catalog/practitioners/practitioners-page-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function PractitionersPage() {
  const [state, currentUser] = await Promise.all([
    loadPractitionersCatalogPage(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_practitioners"),
  );

  return (
    <PractitionersCatalogPage
      canCreate={canCreate}
      createAction={createPractitionerAction}
      state={state}
    />
  );
}
