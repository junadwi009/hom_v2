"use server";
import { z } from "zod";
import { loadClientDetail } from "./client-detail-loader";
import type { ClientDetailResult } from "./client-detail-types";

const clientIdSchema = z.string().uuid();

export async function loadClientDetailAction(clientId: string): Promise<ClientDetailResult> {
  const parsed = clientIdSchema.safeParse(clientId);
  if (!parsed.success) return { status: "error" };
  return loadClientDetail(parsed.data);
}
