import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("minimum local auth safety", () => {
  it("keeps local Supabase signup disabled", () => {
    const config = readWorkspaceFile("supabase/config.toml");

    expect(config).toMatch(/\[auth\][\s\S]*enable_signup = false/);
  });

  it("does not introduce a browser service-role client", () => {
    const browserClient = readWorkspaceFile(
      "apps/web/src/lib/supabase/browser.ts",
    );
    const proxy = readWorkspaceFile("apps/web/src/proxy.ts");

    expect(browserClient).not.toMatch(/SERVICE_ROLE/i);
    expect(proxy).not.toMatch(/SERVICE_ROLE/i);
  });

  it("keeps the login server-action module free of exported state objects", () => {
    const actions = readWorkspaceFile(
      "apps/web/src/features/auth/auth-actions.ts",
    );

    expect(actions).not.toMatch(/export const initialLoginActionState/);
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
