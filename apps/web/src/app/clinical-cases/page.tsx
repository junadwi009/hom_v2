import { ModuleMockPage } from "@/features/module-page/module-mock-page";
import { modulePages } from "@/lib/mock-data";

export default function ClinicalCasesPage() {
  return (
    <ModuleMockPage
      {...modulePages.approvals}
      eyebrow="Clinical"
      title="Chronic Case Registry"
      description="Mock restricted registry shell. Clinical detail access, audit logs, and note workflows are deferred."
    />
  );
}
