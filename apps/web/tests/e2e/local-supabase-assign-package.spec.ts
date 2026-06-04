import { expect, test } from "@playwright/test";

const runLocalSupabase = process.env.HOM_E2E_LOCAL_SUPABASE === "1";
const localFixtureEmail = process.env.HOM_E2E_LOCAL_AUTH_EMAIL;
const localFixturePassword = process.env.HOM_E2E_LOCAL_AUTH_PASSWORD;

// Local-only, eligible (active, non-archived) seed identifiers.
const eligibleClientId = "10000000-0000-4000-8000-000000000028";
const eligibleClientName = "Mock Client 028";
const activePackageId = "50000000-0000-4000-8000-000000000007";
const activePackageName = "Mock Long Validity Pack";
// 6 sessions, 90-day validity. Purchased 2036-07-15 09:00 +07 => expires 2036-10-13.
const purchasedAtLocal = "2036-07-15T09:00";
const expectedExpiryDate = "2036-10-13";
const expectedSessions = "6";

test.describe("local Supabase assign package", () => {
  test.skip(
    !runLocalSupabase,
    "Enable explicitly for the local-only Supabase assign package verification.",
  );

  test("studio director assigns an active package to an eligible client", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    expect(localFixtureEmail).toBeTruthy();
    expect(localFixturePassword).toBeTruthy();

    // Unauthenticated access redirects to the login screen.
    await page.goto("/client-packages");
    await expect(page).toHaveURL(/\/login$/);

    // Local studio director can log in.
    await page.getByLabel("Email").fill(localFixtureEmail ?? "");
    await page.getByLabel("Password").fill(localFixturePassword ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

    // /api/me returns the mapped user with can_manage_client_packages.
    const currentUser = await page.evaluate(async () => {
      const response = await fetch("/api/me");
      return {
        status: response.status,
        body: await response.json(),
      };
    });

    expect(currentUser).toMatchObject({
      status: 200,
      body: {
        ok: true,
        data: {
          user: {
            fullName: "Local Studio Director",
            roles: ["studio_director"],
          },
        },
        meta: { authMode: "supabase" },
      },
    });
    expect(currentUser.body.data.user.permissions).toContain(
      "can_manage_client_packages",
    );

    // /client-packages renders real local seeded rows.
    await page.goto("/client-packages");
    await expect(
      page.getByRole("heading", { name: "Client Packages", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Mock Client Alpha" }).first(),
    ).toHaveCount(0);
    await expect(
      page.getByRole("cell", { name: "Mock Client 001" }).first(),
    ).toBeVisible();

    // Assign Package trigger is enabled for the permitted user.
    const assignTrigger = page.getByRole("button", { name: "Assign Package" });
    await expect(assignTrigger).toBeEnabled();
    await assignTrigger.click();

    const dialog = page.getByRole("dialog", { name: "Assign Package" });
    await expect(dialog).toBeVisible();
    // Supabase data mode must not show the mock preview-disabled banner.
    await expect(
      dialog.getByText(/Preview mode: saving is disabled/i),
    ).toHaveCount(0);

    // No payment, contact, clinical, or WhatsApp fields are present.
    await expect(dialog.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(
      dialog.getByLabel("Clinical notes", { exact: true }),
    ).toHaveCount(0);
    await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);

    // Select an eligible client and an active package.
    await dialog.locator('select[name="clientId"]').selectOption(eligibleClientId);
    await dialog
      .locator('select[name="packageId"]')
      .selectOption(activePackageId);
    await dialog.getByLabel("Purchase date and time").fill(purchasedAtLocal);

    // Preview shows copied total sessions, starting remaining, and expiry.
    await expect(dialog.getByText("Total Sessions")).toBeVisible();
    await expect(dialog.getByText("Starting Remaining")).toBeVisible();
    await expect(dialog.getByText(expectedExpiryDate)).toBeVisible();
    await expect(
      dialog.locator("dd", { hasText: new RegExp(`^${expectedSessions}$`) }),
    ).toHaveCount(2);

    // Submit succeeds; sheet closes and a success state appears.
    const submitButton = dialog.getByRole("button", { name: "Assign Package" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByText("Package assigned.")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole("dialog", { name: "Assign Package" }),
    ).toHaveCount(0);

    // The refreshed list shows the newly assigned client package.
    const newRow = page
      .getByRole("row")
      .filter({ hasText: eligibleClientName })
      .filter({ hasText: activePackageName });
    await expect(newRow.first()).toBeVisible({ timeout: 20_000 });
    await expect(newRow.first()).toContainText("6 / 6");
  });
});
