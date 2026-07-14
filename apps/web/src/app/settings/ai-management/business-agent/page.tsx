import { getCurrentUser } from "@/lib/auth/current-user";
import { getDataMode } from "@/lib/env/app-mode";
import { AiBusinessAgentPage } from "@/features/ai-business-agent/ai-business-agent-page";

export const dynamic = "force-dynamic";

export default async function BusinessAgentSettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  const canUse = user?.permissions.includes("can_use_ai_business_agent") ?? false;
  const source = getDataMode() === "supabase" ? "supabase" : "mock";

  return <AiBusinessAgentPage canUse={canUse} source={source} />;
}
