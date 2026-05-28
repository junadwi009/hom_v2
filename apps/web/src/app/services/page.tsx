import { ServicesCatalogPage } from "@/features/catalog/services/services-catalog-page";
import { loadServicesCatalogPage } from "@/features/catalog/services/services-page-loader";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const state = await loadServicesCatalogPage();

  return <ServicesCatalogPage state={state} />;
}
