import { describe, expect, it } from "vitest";
import { mockEmbed } from "@/lib/ai/gateway/mock-adapter";

describe("mockEmbed", () => {
  it("returns a 1536-dim vector", () => {
    expect(mockEmbed("hello")).toHaveLength(1536);
  });
  it("is deterministic for the same input", () => {
    expect(mockEmbed("hello")).toEqual(mockEmbed("hello"));
  });
  it("differs for different input", () => {
    expect(mockEmbed("hello")).not.toEqual(mockEmbed("world"));
  });
});
