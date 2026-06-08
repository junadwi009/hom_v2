import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// AI Management is a section, not a leaf page. Land on the first sub-page.
export default function AiManagementPage() {
  redirect("/settings/ai-management/business-agent");
}
