import { ClinicalCasesPage } from "@/features/clinical-cases/clinical-cases-page";
import { createClinicalCaseAction } from "@/features/clinical-cases/create-clinical-case-action";
import { loadClinicalCasesData } from "@/features/clinical-cases/clinical-cases-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [data, currentUser] = await Promise.all([
    loadClinicalCasesData(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_clinical_cases"),
  );

  return (
    <ClinicalCasesPage
      canCreate={canCreate}
      cases={data.cases}
      clients={data.clients}
      createAction={createClinicalCaseAction}
    />
  );
}
