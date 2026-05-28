import { ModuleMockPage } from "@/features/module-page/module-mock-page";
import { modulePages } from "@/lib/mock-data";

export default function SettingsPage() {
  return <ModuleMockPage {...modulePages.settings} />;
}
