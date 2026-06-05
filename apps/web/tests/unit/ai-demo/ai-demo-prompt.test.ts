import { describe, expect, it } from "vitest";

import { buildAiDemoMessages } from "../../../src/lib/ai/ai-demo-prompt";
import type { AiDemoAggregate } from "../../../src/lib/ai/ai-demo-types";

const aggregate: AiDemoAggregate = {
  appointmentsByStatus: { scheduled: 2, completed: 1 },
  upcomingAppointmentCount: 2,
  paymentsByStatus: { paid: 2, pending: 1 },
  paymentTotalsByStatusIdr: { paid: 1_250_000, pending: 150_000 },
  activePackageCount: 2,
  totalRemainingSessions: 14,
  lowSessionPackageCount: 0,
};

describe("ai demo prompt builder", () => {
  it("builds system + user messages with JSON, Indonesian, and no-advice instructions", () => {
    const messages = buildAiDemoMessages(aggregate);

    expect(messages).toHaveLength(2);
    const [system, user] = messages;
    expect(system.role).toBe("system");
    expect(system.content).toContain("strict JSON");
    expect(system.content.toLowerCase()).toContain("indonesian");
    expect(system.content).toContain(
      "Do not provide financial, legal, or medical advice.",
    );
    expect(system.content).toContain("Do not invent exact client identities");
    expect(user.role).toBe("user");
  });

  it("sends only allowlisted aggregate keys and excludes any sensitive fields", () => {
    const polluted = {
      ...aggregate,
      clientEmail: "demo@example.com",
      clientPhone: "+620000000",
      noteText: "secret note",
      cancellationReason: "secret reason",
      paymentReferenceNumber: "REF-123",
      cardNumber: "4111111111111111",
    } as unknown as AiDemoAggregate;

    const serialized = JSON.stringify(buildAiDemoMessages(polluted));

    for (const forbidden of [
      "demo@example.com",
      "+620000000",
      "secret note",
      "secret reason",
      "REF-123",
      "4111111111111111",
      "clientEmail",
      "clientPhone",
      "noteText",
      "cancellationReason",
      "paymentReferenceNumber",
      "cardNumber",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }

    expect(serialized).toContain("appointmentsByStatus");
    expect(serialized).toContain("paymentTotalsByStatusIdr");
    expect(serialized).toContain("totalRemainingSessions");
  });
});
