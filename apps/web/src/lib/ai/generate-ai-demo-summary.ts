import "server-only";

import { loadAiDemoAggregate } from "./ai-demo-aggregate-loader";
import { getAiDemoConfig, getOpenRouterApiKey } from "./ai-demo-config";
import { buildAiDemoMessages, type AiDemoChatMessage } from "./ai-demo-prompt";
import {
  AI_DEMO_UNAVAILABLE_MESSAGE,
  aiDemoSummarySchema,
  type AiDemoAggregate,
  type AiDemoSummary,
  type AiDemoSummaryState,
} from "./ai-demo-types";
import { requestOpenRouterSummary } from "./openrouter-client";

type GenerateAiDemoSummaryOptions = {
  config?: ReturnType<typeof getAiDemoConfig>;
  apiKey?: string | null;
  loadAggregate?: () => Promise<AiDemoAggregate>;
  requestSummary?: (input: {
    apiKey: string;
    model: string;
    messages: AiDemoChatMessage[];
  }) => Promise<string>;
};

export async function generateAiDemoSummary(
  options: GenerateAiDemoSummaryOptions = {},
): Promise<AiDemoSummaryState> {
  const config = options.config ?? getAiDemoConfig();
  if (!config.enabled) {
    return { status: "disabled" };
  }

  const apiKey = options.apiKey ?? getOpenRouterApiKey();
  if (!apiKey) {
    return { status: "disabled" };
  }

  try {
    const aggregate = await (options.loadAggregate ?? loadAiDemoAggregate)();
    const messages = buildAiDemoMessages(aggregate);
    const raw = await (options.requestSummary ?? requestOpenRouterSummary)({
      apiKey,
      model: config.model,
      messages,
    });

    return {
      status: "success",
      summary: parseSummary(raw),
      model: config.model,
    };
  } catch {
    return { status: "unavailable", message: AI_DEMO_UNAVAILABLE_MESSAGE };
  }
}

function parseSummary(raw: string): AiDemoSummary {
  const parsed: unknown = JSON.parse(extractJsonObject(raw));
  return aiDemoSummarySchema.parse(parsed);
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return raw;
  }
  return raw.slice(start, end + 1);
}
