import "server-only";
import OpenAI from "openai";
import { MODEL_ALIASES } from "./config";
import type { EmbeddingVector } from "./types";

const TIMEOUT_MS = 20_000;
export class GatewayError extends Error {}

function client(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
}

export async function openAiEmbed(apiKey: string, texts: string[]): Promise<EmbeddingVector[]> {
  try {
    const res = await client(apiKey).embeddings.create({
      model: MODEL_ALIASES.embedding,
      input: texts,
    });
    return res.data.map((d) => d.embedding as number[]);
  } catch {
    throw new GatewayError("Embedding request failed.");
  }
}

export async function openAiExtractImage(
  apiKey: string,
  input: { base64: string; mimeType: string },
): Promise<string> {
  try {
    const res = await client(apiKey).chat.completions.create({
      model: MODEL_ALIASES.vision,
      max_tokens: 1500,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract ALL readable text from this document image verbatim. If it is a table, keep rows. Add a one-line description at the end prefixed 'DESCRIPTION:'. Do not invent content.",
            },
            { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${input.base64}` } },
          ],
        },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") throw new GatewayError("Empty vision result.");
    return content;
  } catch {
    throw new GatewayError("Image extraction failed.");
  }
}

export async function openAiAnswer(
  apiKey: string,
  input: { question: string; contexts: string[] },
): Promise<string> {
  const context = input.contexts.map((c, i) => `[${i + 1}] ${c}`).join("\n\n");
  try {
    const res = await client(apiKey).chat.completions.create({
      model: MODEL_ALIASES.answer,
      max_tokens: 600,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Answer ONLY from the provided context. If the context is insufficient, say you don't have enough information. Never diagnose, never promise refunds/healing/discounts, never confirm reschedules. Cite sources as [n].",
        },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${input.question}` },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") throw new GatewayError("Empty answer.");
    return content;
  } catch {
    throw new GatewayError("Answer generation failed.");
  }
}
