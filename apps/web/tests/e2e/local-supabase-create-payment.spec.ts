import { expect, test, type Page } from "@playwright/test";

const runLocalSupabase = process.env.HOM_E2E_LOCAL_SUPABASE === "1";
const localFixtureEmail = process.env.HOM_E2E_LOCAL_AUTH_EMAIL;
const localFixturePassword = process.env.HOM_E2E_LOCAL_AUTH_PASSWORD;

const clientId = "10000000-0000-4000-8000-000000000001";
// Seed client package 51...001 belongs to client 001.
const clientPackageId = "51000000-0000-4000-8000-000000000001";

test.describe("local Supabase create manual payment", () => {
  test.skip(
    !runLocalSupabase,
    "Enable explicitly for the local-only Supabase create payment verification.",
  );

  test("studio director creates pending and paid manual payments", async ({
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

    // Pending payment, unlinked.
    await createPayment(page, {
      amountIdr: "770001",
      paymentMethod: "cash",
      status: "pending",
    });
    await expect(page.getByText("Payment created.")).toBeVisible({
      timeout: 20_000,
    });

    // Paid payment, linked to the client's own package.
    await createPayment(page, {
      amountIdr: "770002",
      paymentMethod: "bank_transfer",
      status: "paid",
      clientPackageId,
      paidAtLocal: "2026-06-03T09:00",
    });

    const paidRow = page
      .getByRole("row")
      .filter({ hasText: "Mock Client 001" })
      .filter({ hasText: "Rp 770.002" });
    await expect(paidRow.first()).toBeVisible({ timeout: 20_000 });
    await expect(paidRow.first()).toContainText("paid");
  });
});

async function createPayment(
  page: Page,
  input: {
    amountIdr: string;
    paymentMethod: string;
    status: "pending" | "paid";
    clientPackageId?: string;
    paidAtLocal?: string;
  },
) {
  await page.getByRole("button", { name: "Create Payment" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Payment" });
  await expect(dialog).toBeVisible();

  await dialog.locator('select[name="clientId"]').selectOption(clientId);
  if (input.clientPackageId) {
    await dialog
      .locator('select[name="clientPackageId"]')
      .selectOption(input.clientPackageId);
  }
  await dialog.getByLabel("Amount (IDR)").fill(input.amountIdr);
  await dialog
    .locator('select[name="paymentMethod"]')
    .selectOption(input.paymentMethod);
  await dialog.locator('select[name="status"]').selectOption(input.status);
  if (input.status === "paid" && input.paidAtLocal) {
    await dialog.getByLabel("Paid date and time").fill(input.paidAtLocal);
  }

  await dialog
    .getByRole("button", { name: "Create Payment", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Create Payment" }),
  ).toHaveCount(0, { timeout: 20_000 });
}
