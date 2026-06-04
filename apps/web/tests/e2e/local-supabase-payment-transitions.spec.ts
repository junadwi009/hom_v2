import { expect, test, type Page } from "@playwright/test";

const runLocalSupabase = process.env.HOM_E2E_LOCAL_SUPABASE === "1";
const localFixtureEmail = process.env.HOM_E2E_LOCAL_AUTH_EMAIL;
const localFixturePassword = process.env.HOM_E2E_LOCAL_AUTH_PASSWORD;

// Seeded pending payments visible on page one (most recent created_at).
// Payment 60...024 (Mock Client 030) and 60...022 (Mock Client 026).
const markPaidClient = "Mock Client 030";
const cancelClient = "Mock Client 026";

test.describe("local Supabase payment transitions", () => {
  test.skip(
    !runLocalSupabase,
    "Enable explicitly for the local-only Supabase payment transition verification.",
  );

  test("studio director marks a payment paid and cancels another", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    expect(localFixtureEmail).toBeTruthy();
    expect(localFixturePassword).toBeTruthy();

    await page.goto("/payments");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email").fill(localFixtureEmail ?? "");
    await page.getByLabel("Password").fill(localFixturePassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

    await page.goto("/payments");
    await expect(
      page.getByRole("heading", { name: "Payments", exact: true }),
    ).toBeVisible();

    // Mark a pending payment paid.
    await expect(rowFor(page, markPaidClient)).toContainText("pending");
    await rowFor(page, markPaidClient)
      .getByRole("button", { name: /Mark payment paid for/ })
      .click();
    const markPaidDialog = page.getByRole("dialog", {
      name: "Mark payment paid",
    });
    await expect(markPaidDialog).toBeVisible();
    await markPaidDialog.getByRole("button", { name: "Confirm Paid" }).click();
    await expect(
      page.getByRole("dialog", { name: "Mark payment paid" }),
    ).toHaveCount(0, { timeout: 20_000 });
    await expect(rowFor(page, markPaidClient)).toContainText("paid", {
      timeout: 20_000,
    });

    // Cancel a pending payment with a reason.
    await expect(rowFor(page, cancelClient)).toContainText("pending");
    await rowFor(page, cancelClient)
      .getByRole("button", { name: /Cancel payment for/ })
      .click();
    const cancelDialog = page.getByRole("dialog", { name: "Cancel payment" });
    await expect(cancelDialog).toBeVisible();
    await cancelDialog
      .getByLabel("Cancellation reason")
      .fill("Mock duplicate charge.");
    await cancelDialog
      .getByRole("button", { name: "Confirm Cancellation" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Cancel payment" }),
    ).toHaveCount(0, { timeout: 20_000 });
    await expect(rowFor(page, cancelClient)).toContainText("cancelled", {
      timeout: 20_000,
    });
  });
});

function rowFor(page: Page, clientName: string) {
  return page.getByRole("row").filter({ hasText: clientName });
}
