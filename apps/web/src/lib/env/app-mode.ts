import { authModeSchema } from "@hom/domain/auth";
import { z } from "zod";

const dataModeSchema = z.enum(["mock", "supabase"]);

export function getAuthMode() {
  return authModeSchema
    .catch("mock")
    .parse(process.env.HOM_AUTH_MODE ?? "mock");
}

export function getDataMode() {
  return dataModeSchema
    .catch("mock")
    .parse(process.env.HOM_DATA_MODE ?? "mock");
}
