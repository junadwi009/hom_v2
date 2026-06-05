import "server-only";

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4.1-mini";

export type AiDemoConfig =
  | { enabled: true; model: string }
  | { enabled: false; reason: "disabled" | "missing_key" };

function readTrimmedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function getAiDemoModel(): string {
  return readTrimmedEnv("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL;
}

/**
 * Server-only. The OpenRouter API key must never be returned to or rendered by a
 * client component. It is read here and consumed only inside the server adapter.
 */
export function getOpenRouterApiKey(): string | null {
  return readTrimmedEnv("OPENROUTER_API_KEY");
}

export function isAiDemoFlagEnabled(): boolean {
  return readTrimmedEnv("AI_DEMO_ENABLED")?.toLowerCase() === "true";
}

export function getAiDemoConfig(): AiDemoConfig {
  if (!isAiDemoFlagEnabled()) {
    return { enabled: false, reason: "disabled" };
  }

  if (!getOpenRouterApiKey()) {
    return { enabled: false, reason: "missing_key" };
  }

  return { enabled: true, model: getAiDemoModel() };
}

export function isAiDemoEnabled(): boolean {
  return getAiDemoConfig().enabled;
}
