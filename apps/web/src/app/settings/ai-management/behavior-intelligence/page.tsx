import { ModuleMockPage } from "@/features/module-page/module-mock-page";
import { modulePages } from "@/lib/mock-data";

export default function BehaviorIntelligencePage() {
  return <ModuleMockPage {...modulePages.behavior} eyebrow="AI Management" />;
}
