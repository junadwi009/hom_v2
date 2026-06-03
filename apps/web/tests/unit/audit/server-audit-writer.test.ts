import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createServerAuditWriter,
  prepareServerAuditLogInput,
  UnsafeAuditMetadataError,
} from "../../../src/lib/audit/server/audit-writer";

const validInput = {
  actorUserId: "00000000-0000-4000-8000-000000000001",
  actorAuthUserId: "00000000-0000-4000-8000-000000000002",
  action: "appointment.created",
  targetType: "appointment",
  targetId: "40000000-0000-4000-8000-000000000001",
  riskLevel: "high",
  metadata: {
    source: "admin",
    durationMinutes: 60,
  },
} as const;

describe("server-only audit writer", () => {
  it("validates approved input and forwards it to the injected server sink", async () => {
    const append = vi.fn(async () => undefined);
    const writer = createServerAuditWriter({ append });

    await expect(writer.write(validInput)).resolves.toEqual(validInput);
    expect(append).toHaveBeenCalledWith(validInput);
  });

  it("redacts recognized sensitive keys before data reaches the sink", async () => {
    const append = vi.fn(async () => undefined);
    const writer = createServerAuditWriter({ append });

    const safeInput = await writer.write({
      ...validInput,
      metadata: {
        source: "admin",
        actorEmail: "masked upstream",
        nested: {
          phone: "masked upstream",
        },
      },
    });

    expect(safeInput.metadata).toEqual({
      source: "admin",
      actorEmail: "[REDACTED]",
      nested: {
        phone: "[REDACTED]",
      },
    });
    expect(JSON.stringify(append.mock.calls)).not.toContain(
      "masked upstream",
    );
  });

  it.each([
    {
      label: "secret-like value",
      metadata: {
        context: `Bearer ${["s", "k"].join("")}-unsafe-example-value`,
      },
    },
    {
      label: "raw contact value",
      metadata: {
        context: "mock.owner@example.invalid",
      },
    },
    {
      label: "raw phone value",
      metadata: {
        context: "+62 000-0000-0001",
      },
    },
    {
      label: "API key value",
      metadata: {
        context: "API key unsafe-example-value",
      },
    },
    {
      label: "raw clinical note",
      metadata: {
        context: "Clinical note content must not be logged.",
      },
    },
    {
      label: "payment detail",
      metadata: {
        context: "Payment detail must not be logged.",
      },
    },
    {
      label: "WhatsApp message content",
      metadata: {
        context: "WhatsApp message content must not be logged.",
      },
    },
  ])("rejects $label that escapes keyed redaction", async ({ metadata }) => {
    const append = vi.fn(async () => undefined);
    const writer = createServerAuditWriter({ append });

    await expect(
      writer.write({
        ...validInput,
        metadata,
      }),
    ).rejects.toBeInstanceOf(UnsafeAuditMetadataError);
    expect(append).not.toHaveBeenCalled();
  });

  it("uses existing audit schemas for input validation", () => {
    expect(() =>
      prepareServerAuditLogInput({
        ...validInput,
        action: "not valid",
      }),
    ).toThrow();
  });

  it("keeps the writer behind the server-only module marker", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/audit/server/audit-writer.ts",
    );

    expect(source).toContain('import "server-only";');
  });

  it("keeps direct authenticated audit insert blocked in the RLS migration", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260526000300_rls_helpers_and_policies.sql",
    );

    expect(migration).toContain("revoke all on public.audit_logs from authenticated;");
    expect(migration).toContain("grant select on public.audit_logs to authenticated;");
    expect(migration).not.toContain("grant insert on public.audit_logs to authenticated;");
    expect(migration).not.toMatch(
      /create policy "[^"]+"\s+on public\.audit_logs\s+for insert/i,
    );
  });

  it("does not add a browser audit writer", () => {
    const serverIndex = readWorkspaceFile("apps/web/src/lib/audit/server/index.ts");

    expect(serverIndex).toContain("./audit-writer");
    expect(() =>
      readWorkspaceFile("apps/web/src/lib/audit/browser/audit-writer.ts"),
    ).toThrow();
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
