import { expect, test } from "@playwright/test";

test.describe("Knowledge Studio", () => {
  test("renders heading and upload/test-lab or a safe gate", async ({ page }) => {
    await page.goto("/settings/ai-management/knowledge-studio");

    await expect(page.getByRole("heading", { name: "Knowledge Studio" })).toBeVisible();

    // Either the owner sees the panels, or a non-owner/mock sees a safe state — never a crash.
    const signalCount = await page
      .getByText(/Mode preview|Upload Dokumen|akses|Konfigurasi|Segera|preview/i)
      .count();
    expect(signalCount).toBeGreaterThan(0);
  });

  test("redirects /knowledge-studio to the settings path", async ({ page }) => {
    await page.goto("/knowledge-studio");

    await expect(page).toHaveURL(/\/settings\/ai-management\/knowledge-studio$/);
    await expect(page.getByRole("heading", { name: "Knowledge Studio" })).toBeVisible();
  });
});
