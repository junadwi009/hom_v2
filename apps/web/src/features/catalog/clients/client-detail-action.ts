"use server";

import type { ClientDetailState } from "./client-detail-types";
import { loadClientDetail } from "./load-client-detail";

export async function getClientDetailAction(
  clientId: string,
): Promise<ClientDetailState> {
  return loadClientDetail(clientId);
}
