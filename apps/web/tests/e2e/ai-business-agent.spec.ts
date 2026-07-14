import { expect, test } from "@playwright/test";

test.describe("AI Business Agent", () => {
  test("renders heading and a safe state", async ({ page }) => {
    await page.goto("/settings/ai-management/business-agent");
    await expect(page.getByRole("heading", { name: "AI Business Agent" })).toBeVisible();
    const signal = await page.getByText(/Mode preview|Assistant|akses|Konfigurasi|Tanya/i).count();
    expect(signal).toBeGreaterThan(0);
  });
});
