import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getAiDemoConfig,
  getAiDemoModel,
  isAiDemoEnabled,
} from "../../../src/lib/ai/ai-demo-config";

afterEach(() => {
  delete process.env.AI_DEMO_ENABLED;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
});

describe("ai demo config", () => {
  it("is disabled when AI_DEMO_ENABLED is not 'true'", () => {
    process.env.AI_DEMO_ENABLED = "false";
    process.env.OPENROUTER_API_KEY = "sk-or-test-key";

    expect(isAiDemoEnabled()).toBe(false);
    expect(getAiDemoConfig()).toEqual({ enabled: false, reason: "disabled" });
  });

  it("is disabled (missing_key) when the key is absent even if the flag is true", () => {
    process.env.AI_DEMO_ENABLED = "true";

    expect(getAiDemoConfig()).toEqual({ enabled: false, reason: "missing_key" });
    expect(isAiDemoEnabled()).toBe(false);
  });

  it("is enabled when the flag is true and the key is present", () => {
    process.env.AI_DEMO_ENABLED = "true";
    process.env.OPENROUTER_API_KEY = "sk-or-test-key";
    process.env.OPENROUTER_MODEL = "google/gemini-2.5-flash";

    expect(getAiDemoConfig()).toEqual({
      enabled: true,
      model: "google/gemini-2.5-flash",
    });
  });

  it("defaults the model to openai/gpt-4.1-mini when unset", () => {
    expect(getAiDemoModel()).toBe("openai/gpt-4.1-mini");
  });
});
