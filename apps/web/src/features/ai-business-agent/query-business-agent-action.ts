"use server";

import { submitBusinessAgentQuery } from "@/lib/ai/business-agent/server/submit-business-agent-query";
import type { BusinessAgentQueryState } from "./business-agent-action-types";

export async function queryBusinessAgentAction(
  _prev: BusinessAgentQueryState,
  formData: FormData,
): Promise<BusinessAgentQueryState> {
  return submitBusinessAgentQuery(formData);
}
