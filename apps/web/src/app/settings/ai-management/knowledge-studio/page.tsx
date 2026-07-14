import { getCurrentUser } from "@/lib/auth/current-user";
import { KnowledgeStudioPage } from "@/features/knowledge-studio/knowledge-studio-page";
import { loadKnowledgeStudioPage } from "@/features/knowledge-studio/knowledge-studio-page-loader";
import { KnowledgeTestLab } from "@/features/knowledge-studio/knowledge-test-lab";
import { KnowledgeUploadPanel } from "@/features/knowledge-studio/knowledge-upload-panel";

export const dynamic = "force-dynamic";

export default async function KnowledgeStudioSettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  const canManage = user?.permissions.includes("can_manage_knowledge") ?? false;
  const state = await loadKnowledgeStudioPage(canManage);

  return (
    <KnowledgeStudioPage
      state={state}
      uploadSlot={<KnowledgeUploadPanel />}
      testLabSlot={<KnowledgeTestLab />}
    />
  );
}
