import { createTagAction } from "@/features/clients/tags/create-tag-action";
import { TagsPage } from "@/features/clients/tags/tags-page";
import { loadRealTags } from "@/features/clients/tags/tags-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [realTags, currentUser] = await Promise.all([
    loadRealTags(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_clients"),
  );

  return (
    <TagsPage
      canCreate={canCreate}
      createAction={createTagAction}
      realTags={realTags}
    />
  );
}
