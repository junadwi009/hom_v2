import { expect, test } from "@playwright/test";

const runLocalSupabase = process.env.HOM_E2E_LOCAL_SUPABASE === "1";
const localFixtureEmail = process.env.HOM_E2E_LOCAL_AUTH_EMAIL;
const localFixturePassword = process.env.HOM_E2E_LOCAL_AUTH_PASSWORD;

// Active, non-archived seed client that owns eligible active packages.
const clientId = "10000000-0000-4000-8000-000000000001";
const clientName = "Mock Client 001";
const practitionerId = "20000000-0000-4000-8000-000000000007";
const serviceId = "30000000-0000-4000-8000-000000000006";
const futureStartLocal = "2037-09-12T09:00";
// Seed client package 51...001 (Mock Intro Package), active, remaining 2.
const eligiblePackageOptionLabel = "Mock Intro Package (2 left)";

test.describe("local Supabase deduct session", () => {
  test.skip(
    !runLocalSupabase,
    "Enable explicitly for the local-only Supabase deduct session verification.",
  );

  test("studio director deducts a session for a completed appointment", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    expect(localFixtureEmail).toBeTruthy();
    expect(localFixturePassword).toBeTruthy();

    await page.goto("/appointments");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email").fill(localFixtureEmail ?? "");
    await page.getByLabel("Password").fill(localFixturePassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

    await page.goto("/appointments");
    await expect(
      page.getByRole("heading", { name: "Appointments", exact: true }),
    ).toBeVisible();

    // Create a fresh future appointment, then complete it.
    await page.getByRole("button", { name: "New Appointment" }).click();
    await page.locator('select[name="clientId"]').selectOption(clientId);
    await page.locator('select[name="practitionerId"]').selectOption(practitionerId);
    await page.locator('select[name="serviceId"]').selectOption(serviceId);
    await page.getByLabel("Start time").fill(futureStartLocal);
    await page.getByLabel("Operational summary").fill("Mock deduct session demo.");
    await page.getByRole("button", { name: "Create Appointment" }).click();

    const createdRow = page
      .getByRole("row")
      .filter({ hasText: clientName })
      .filter({ hasText: "2037" });
    await expect(createdRow).toContainText("scheduled", { timeout: 20_000 });

    await createdRow
      .getByRole("button", { name: /Complete appointment for/ })
      .click();
    await page.getByRole("button", { name: "Confirm Completion" }).click();
    await expect(createdRow).toContainText("completed", { timeout: 20_000 });

    // Deduct one session through the UI.
    await createdRow
      .getByRole("button", { name: /Deduct session for/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Deduct Session" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/Preview mode: deduction is disabled/i),
    ).toHaveCount(0);
    await expect(dialog.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(
      dialog.getByLabel("Clinical notes", { exact: true }),
    ).toHaveCount(0);
    await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);

    await dialog
      .locator('select[name="clientPackageId"]')
      .selectOption({ label: eligiblePackageOptionLabel });
    await expect(dialog.getByText("Remaining Before")).toBeVisible();
    await expect(dialog.getByText("Remaining After")).toBeVisible();
    await expect(dialog.getByText("Mock Intro Package", { exact: true })).toBeVisible();

    const submit = dialog.getByRole("button", {
      name: "Deduct Session",
      exact: true,
    });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText("Session deducted.")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole("dialog", { name: "Deduct Session" }),
    ).toHaveCount(0);

    // Duplicate deduction is prevented: the control is now disabled.
    const settledRow = page
      .getByRole("row")
      .filter({ hasText: clientName })
      .filter({ hasText: "2037" });
    await expect(
      settledRow.getByRole("button", { name: /Deduct session for/ }),
    ).toBeDisabled({ timeout: 20_000 });
  });
});
