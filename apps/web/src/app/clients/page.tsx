import { getClientDetailAction } from "@/features/catalog/clients/client-detail-action";
import { ClientsCatalogPage } from "@/features/catalog/clients/clients-catalog-page";
import { loadClientsCatalogPage } from "@/features/catalog/clients/clients-page-loader";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const state = await loadClientsCatalogPage();

  return <ClientsCatalogPage detailAction={getClientDetailAction} state={state} />;
}
