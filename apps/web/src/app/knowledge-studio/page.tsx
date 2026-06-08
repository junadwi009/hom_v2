import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Moved under Settings → AI Management.
export default function KnowledgeStudioRedirect() {
  redirect("/settings/ai-management/knowledge-studio");
}
