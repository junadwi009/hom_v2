import "server-only";
import type { GatewayMode } from "./types";

function readTrimmedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}
export function getOpenAiApiKey(): string | null {
  return readTrimmedEnv("OPENAI_API_KEY");
}
export function getGatewayMode(): GatewayMode {
  return getOpenAiApiKey() ? "openai" : "mock";
}
export const MODEL_ALIASES = {
  embedding: "text-embedding-3-small",
  vision: "gpt-4o-mini",
  answer: "gpt-4o-mini",
} as const;
