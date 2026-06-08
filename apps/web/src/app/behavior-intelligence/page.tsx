import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Moved under Settings → AI Management.
export default function BehaviorIntelligenceRedirect() {
  redirect("/settings/ai-management/behavior-intelligence");
}
