import { ModuleMockPage } from "@/features/module-page/module-mock-page";
import { modulePages } from "@/lib/mock-data";

export default function AiBusinessAgentPage() {
  return <ModuleMockPage {...modulePages.aiAgent} />;
}
