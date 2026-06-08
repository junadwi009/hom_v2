import { createSegmentAction } from "@/features/clients/segments/create-segment-action";
import { SegmentsPage } from "@/features/clients/segments/segments-page";
import { loadRealSegments } from "@/features/clients/segments/segments-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [realSegments, currentUser] = await Promise.all([
    loadRealSegments(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_clients"),
  );

  return (
    <SegmentsPage
      canCreate={canCreate}
      createAction={createSegmentAction}
      realSegments={realSegments}
    />
  );
}
