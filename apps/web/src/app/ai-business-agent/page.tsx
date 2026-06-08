import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Moved under Settings → AI Management.
export default function AiBusinessAgentRedirect() {
  redirect("/settings/ai-management/business-agent");
}
