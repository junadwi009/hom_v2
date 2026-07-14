import "server-only";
import { getGatewayMode, getOpenAiApiKey } from "./config";
import { mockAnswer, mockEmbed, mockVisionExtract } from "./mock-adapter";
import { openAiAnswer, openAiEmbed, openAiExtractImage } from "./openai-adapter";
import type { EmbeddingVector } from "./types";

export type { EmbeddingVector } from "./types";
export { GatewayError } from "./openai-adapter";
export { getGatewayMode } from "./config";

export async function embedTexts(texts: string[]): Promise<EmbeddingVector[]> {
  if (texts.length === 0) return [];
  if (getGatewayMode() === "mock") return texts.map(mockEmbed);
  return openAiEmbed(getOpenAiApiKey() as string, texts);
}
export async function embedText(text: string): Promise<EmbeddingVector> {
  return (await embedTexts([text]))[0];
}
export async function extractImageText(input: {
  base64: string;
  mimeType: string;
  fileName: string;
}): Promise<string> {
  if (getGatewayMode() === "mock") return mockVisionExtract(input.fileName);
  return openAiExtractImage(getOpenAiApiKey() as string, input);
}
export async function answerFromContext(input: {
  question: string;
  contexts: string[];
}): Promise<string> {
  if (getGatewayMode() === "mock") return mockAnswer(input.question, input.contexts);
  return openAiAnswer(getOpenAiApiKey() as string, input);
}
