import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}

const SERVER_ONLY_MODULES = [
  "apps/web/src/lib/ai/ai-demo-config.ts",
  "apps/web/src/lib/ai/ai-demo-aggregate-loader.ts",
  "apps/web/src/lib/ai/openrouter-client.ts",
  "apps/web/src/lib/ai/generate-ai-demo-summary.ts",
  "apps/web/src/lib/ai/submit-ai-demo-summary.ts",
];

describe("ai demo client safety", () => {
  it("never references NEXT_PUBLIC_OPENROUTER anywhere in the feature", () => {
    const files = [
      ...SERVER_ONLY_MODULES,
      "apps/web/src/features/ai-demo/ai-demo-summary-card.tsx",
      "apps/web/src/features/ai-demo/ai-demo-summary-action.ts",
      "apps/web/src/app/appointments/page.tsx",
    ];
    for (const file of files) {
      expect(readWorkspaceFile(file)).not.toContain("NEXT_PUBLIC_OPENROUTER");
    }
  });

  it("never declares a NEXT_PUBLIC_OPENROUTER variable in .env.example", () => {
    // The prohibition comment may mention the name, but no variable may be declared.
    expect(readWorkspaceFile(".env.example")).not.toMatch(
      /^\s*NEXT_PUBLIC_OPENROUTER\w*\s*=/m,
    );
  });

  it("keeps the API key out of the client card and the client bundle", () => {
    const card = readWorkspaceFile(
      "apps/web/src/features/ai-demo/ai-demo-summary-card.tsx",
    );

    expect(card).toContain('"use client"');
    expect(card).not.toContain("OPENROUTER_API_KEY");
    expect(card).not.toContain("process.env");
    expect(card).not.toContain("openrouter-client");
    expect(card).not.toContain("generate-ai-demo-summary");
    expect(card).not.toContain("ai-demo-aggregate-loader");
    expect(card).not.toContain("ai-demo-config");
  });

  it("marks every server-only AI module with server-only", () => {
    for (const file of SERVER_ONLY_MODULES) {
      expect(readWorkspaceFile(file)).toContain('import "server-only"');
    }
  });

  it("renders disabled, loading, success, error, and disclaimer states", () => {
    const card = readWorkspaceFile(
      "apps/web/src/features/ai-demo/ai-demo-summary-card.tsx",
    );

    expect(card).toContain("Generate Demo Insight");
    expect(card).toContain("Generating...");
    expect(card).toContain('status === "success"');
    expect(card).toContain('status === "unavailable"');
    expect(card).toContain("disabled for this environment");
    expect(card).toContain("AI_DEMO_DISCLAIMER");
  });
});
