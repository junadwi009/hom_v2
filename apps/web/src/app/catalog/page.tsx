import { ServicesCatalogPage } from "@/features/catalog/services/services-catalog-page";
import { loadServicesCatalogPage } from "@/features/catalog/services/services-page-loader";
import { ServicePackageTabs } from "@/features/catalog/service-package/service-package-tabs";
import { PackagesPage } from "@/features/packages/packages/packages-page";
import { loadPackagesPage } from "@/features/packages/packages/packages-page-loader";

export const dynamic = "force-dynamic";

export default async function ServicePackageCatalogPage() {
  const [servicesState, packagesState] = await Promise.all([
    loadServicesCatalogPage(),
    loadPackagesPage(),
  ]);

  return (
    <ServicePackageTabs
      servicesSlot={<ServicesCatalogPage state={servicesState} />}
      packagesSlot={<PackagesPage state={packagesState} />}
    />
  );
}
