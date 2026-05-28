import { describe, expect, it } from "vitest";

import {
  auditLogInputSchema,
  auditRiskLevelSchema,
  redactAuditMetadata,
} from "../src/audit";

describe("audit schemas", () => {
  it("accepts approved audit risk levels only", () => {
    expect(auditRiskLevelSchema.safeParse("high").success).toBe(true);
    expect(auditRiskLevelSchema.safeParse("unsafe").success).toBe(false);
  });

  it("validates structured audit log input", () => {
    const parsed = auditLogInputSchema.safeParse({
      actorUserId: "00000000-0000-4000-8000-000000000001",
      actorAuthUserId: null,
      action: "rbac.permission_checked",
      targetType: "permission",
      targetId: null,
      riskLevel: "low",
      metadata: {
        permission: "can_view_clients",
      },
    });

    expect(parsed.success).toBe(true);
  });
});

describe("audit metadata redaction", () => {
  it("redacts sensitive top-level and nested metadata", () => {
    const redacted = redactAuditMetadata({
      actorEmail: "owner@example.local",
      targetType: "client",
      nested: {
        phone: "+6280000000",
        safeContext: "appointment list opened",
      },
      events: [
        {
          messageText: "raw WhatsApp content",
          status: "draft",
        },
      ],
    });

    expect(redacted).toEqual({
      actorEmail: "[REDACTED]",
      targetType: "client",
      nested: {
        phone: "[REDACTED]",
        safeContext: "appointment list opened",
      },
      events: [
        {
          messageText: "[REDACTED]",
          status: "draft",
        },
      ],
    });
  });

  it("keeps non-sensitive metadata intact", () => {
    const metadata = {
      actionSource: "unit_test",
      recordCount: 2,
    };

    expect(redactAuditMetadata(metadata)).toEqual(metadata);
  });
});
