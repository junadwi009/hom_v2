import { ClientsCatalogPage } from "@/features/catalog/clients/clients-catalog-page";
import { loadClientsCatalogPage } from "@/features/catalog/clients/clients-page-loader";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const state = await loadClientsCatalogPage();

  return <ClientsCatalogPage state={state} />;
}
