import { ModuleMockPage } from "@/features/module-page/module-mock-page";
import { modulePages } from "@/lib/mock-data";

export default function ApprovalsPage() {
  return <ModuleMockPage {...modulePages.approvals} />;
}
