import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateAiDemoSummary } from "../../../src/lib/ai/generate-ai-demo-summary";
import type { AiDemoAggregate } from "../../../src/lib/ai/ai-demo-types";

const aggregate: AiDemoAggregate = {
  appointmentsByStatus: { scheduled: 2 },
  upcomingAppointmentCount: 2,
  paymentsByStatus: { paid: 1 },
  paymentTotalsByStatusIdr: { paid: 1_000_000 },
  activePackageCount: 1,
  totalRemainingSessions: 4,
  lowSessionPackageCount: 0,
};

const enabledConfig = { enabled: true as const, model: "openai/gpt-4.1-mini" };

const validSummaryJson = JSON.stringify({
  summaryTitle: "Ringkasan Operasional Demo",
  appointmentSummary: "Dua jadwal aktif.",
  packageSummary: "Satu paket aktif.",
  paymentSummary: "Satu pembayaran lunas.",
  recommendedFollowUps: ["Tindak lanjuti pembayaran menunggu."],
  riskNotes: ["Pantau ketidakhadiran."],
  demoDisclaimer: "Ringkasan demo, bukan nasihat finansial, hukum, atau medis.",
});

describe("generate ai demo summary", () => {
  it("returns disabled when config is disabled", async () => {
    const result = await generateAiDemoSummary({
      config: { enabled: false, reason: "disabled" },
    });

    expect(result).toEqual({ status: "disabled" });
  });

  it("returns success with the parsed summary on valid JSON", async () => {
    const requestSummary = vi.fn(async () => validSummaryJson);

    const result = await generateAiDemoSummary({
      config: enabledConfig,
      apiKey: "sk-or-test-key",
      loadAggregate: async () => aggregate,
      requestSummary,
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.summary.summaryTitle).toBe("Ringkasan Operasional Demo");
      expect(result.summary.recommendedFollowUps).toEqual([
        "Tindak lanjuti pembayaran menunggu.",
      ]);
      expect(result.model).toBe("openai/gpt-4.1-mini");
    }
    expect(requestSummary).toHaveBeenCalledTimes(1);
  });

  it("maps OpenRouter errors to the safe unavailable state", async () => {
    const result = await generateAiDemoSummary({
      config: enabledConfig,
      apiKey: "sk-or-test-key",
      loadAggregate: async () => aggregate,
      requestSummary: async () => {
        throw new Error("provider boom");
      },
    });

    expect(result).toEqual({
      status: "unavailable",
      message: "AI demo unavailable",
    });
    expect(JSON.stringify(result)).not.toContain("provider boom");
  });

  it("maps invalid JSON to the safe unavailable state", async () => {
    const result = await generateAiDemoSummary({
      config: enabledConfig,
      apiKey: "sk-or-test-key",
      loadAggregate: async () => aggregate,
      requestSummary: async () => "this is not json",
    });

    expect(result).toEqual({
      status: "unavailable",
      message: "AI demo unavailable",
    });
  });
});
