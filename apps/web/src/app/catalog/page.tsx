import {
  createPackageAction,
  createServiceAction,
} from "@/features/catalog/service-package/create-actions";
import { loadRealProducts } from "@/features/catalog/service-package/products-loader";
import { ServiceCatalogPage } from "@/features/catalog/service-package/service-catalog-page";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [realProducts, currentUser] = await Promise.all([
    loadRealProducts(),
    getCurrentUser().catch(() => null),
  ]);

  const canManage = Boolean(
    currentUser?.permissions.includes("can_manage_services"),
  );

  return (
    <ServiceCatalogPage
      canManage={canManage}
      createPackageAction={createPackageAction}
      createServiceAction={createServiceAction}
      realProducts={realProducts}
    />
  );
}
