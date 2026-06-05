import "server-only";

import { type AiDemoChatMessage } from "./ai-demo-prompt";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_TOKENS = 700;

export class OpenRouterError extends Error {}

type RequestOpenRouterSummaryInput = {
  apiKey: string;
  model: string;
  messages: AiDemoChatMessage[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/**
 * Server-only OpenRouter adapter. Short max tokens, ~10s timeout, no retry, no prompt
 * logging. Provider response bodies are never surfaced to callers. Returns the raw
 * assistant message content (expected to be JSON text).
 */
export async function requestOpenRouterSummary(
  input: RequestOpenRouterSummaryInput,
): Promise<string> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetchImpl(OPENROUTER_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: input.messages,
      }),
    });
  } catch (error) {
    throw new OpenRouterError(
      error instanceof Error && error.name === "AbortError"
        ? "OpenRouter request timed out."
        : "OpenRouter request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new OpenRouterError(`OpenRouter returned status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new OpenRouterError("OpenRouter returned an empty completion.");
  }

  return content;
}
