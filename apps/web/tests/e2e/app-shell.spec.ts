import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", title: "Strategic Overview" },
  { path: "/dashboard/executive-command", title: "Strategic Overview" },
  { path: "/appointments", title: "Appointments" },
  { path: "/clients", title: "Clients" },
  { path: "/practitioners", title: "Practitioners" },
  { path: "/services", title: "Services" },
  { path: "/packages", title: "Packages" },
  { path: "/client-packages", title: "Client Packages" },
  { path: "/payments", title: "Payments" },
  { path: "/live-chat", title: "Live Chat" },
  { path: "/knowledge-studio", title: "Knowledge Studio" },
  { path: "/financials", title: "Financials" },
];

test.describe("HOM Studio OS shell", () => {
  for (const route of routes) {
    test(`renders ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.getByText("HOM Studio")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
      await expect(page.getByRole("heading", { name: route.title, exact: true })).toBeVisible();
      await expect(page.getByText("Search clients, appointments, approvals")).toBeVisible();
      await expect(page.getByText("Studio Director").first()).toBeVisible();
    });
  }

  test("returns the mock current user from /api/me", async ({ request }) => {
    const response = await request.get("/api/me");
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        user: {
          fullName: "Studio Director",
          email: "owner@example.local",
          roles: ["studio_director"],
        },
      },
      meta: {
        authMode: "mock",
      },
    });
  });

  test("renders repository-fed mock clients without contact or write controls", async ({ page }) => {
    await page.goto("/clients");

    await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Client Alpha" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Client" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Primary Practitioner" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /phone/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /email/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /create/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
  });

  test("renders repository-fed mock practitioners without contact or write controls", async ({ page }) => {
    await page.goto("/practitioners");

    await expect(page.getByRole("heading", { name: "Practitioners", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Practitioner One" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Practitioner" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "App Profile" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /email/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /contact/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /create/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
  });

  test("renders repository-fed mock services without write or booking controls", async ({ page }) => {
    await page.goto("/services");

    await expect(page.getByRole("heading", { name: "Services", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Intro Assessment" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Service" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Duration" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Default Price" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /book/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /appointment/i })).toHaveCount(0);
  });

  test("renders repository-fed mock packages without write or sensitive controls", async ({ page }) => {
    await page.goto("/packages");

    await expect(page.getByRole("heading", { name: "Packages", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Intro Package" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Package" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Sessions" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Validity" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Price" })).toBeVisible();
    await expect(page.getByText("Rp 750.000")).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /assign/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /deduct/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /payment/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /clinical/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /whatsapp/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /contact/i })).toHaveCount(0);
  });

  test("renders repository-fed mock payments without write or sensitive controls", async ({ page }) => {
    await page.goto("/payments");

    await expect(page.getByRole("heading", { name: "Payments", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Payments" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Client Alpha" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Client" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Package" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Method" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Reference" })).toBeVisible();
    await expect(page.getByText("Rp 750.000").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Payment" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    // Pending rows expose mark paid / cancel transitions only.
    await expect(page.getByRole("button", { name: /Mark payment paid for/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel payment for/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /refund/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /card/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /bank account/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /gateway/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /cvv/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /phone/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /email/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /clinical/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /whatsapp/i })).toHaveCount(0);
  });

  test("opens a preview-safe create payment dialog with conditional paid date and no fake mock persistence", async ({ page }) => {
    await page.goto("/payments");

    await page.getByRole("button", { name: "Create Payment" }).click();
    const dialog = page.getByRole("dialog", { name: "Create Payment" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Preview mode: saving is disabled/i)).toBeVisible();
    await expect(dialog.locator('select[name="clientId"]')).toBeVisible();
    await expect(dialog.locator('select[name="clientPackageId"]')).toBeVisible();
    await expect(dialog.locator('select[name="paymentMethod"]')).toBeVisible();
    await expect(dialog.locator('select[name="status"]')).toBeVisible();
    await expect(dialog.locator('input[name="amountIdr"]')).toBeVisible();

    // Pending hides the paid date; paid reveals a required paid date.
    await expect(dialog.locator('input[name="paidAtLocal"]')).toHaveCount(0);
    await dialog.locator('select[name="status"]').selectOption("paid");
    await expect(dialog.locator('input[name="paidAtLocal"]')).toBeVisible();
    await dialog.locator('select[name="status"]').selectOption("pending");
    await expect(dialog.locator('input[name="paidAtLocal"]')).toHaveCount(0);

    await expect(
      dialog.getByRole("button", { name: "Create Payment", exact: true }),
    ).toBeDisabled();

    await expect(dialog.getByLabel("Card number", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Bank account", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("CVV", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);

    await dialog.getByRole("button", { name: "Close create payment dialog" }).click();
    await expect(page.getByRole("dialog", { name: "Create Payment" })).toHaveCount(0);
  });

  test("opens preview-safe mark paid and cancel payment dialogs without fake mock persistence", async ({ page }) => {
    await page.goto("/payments");

    await page.getByRole("button", { name: /Mark payment paid for/i }).first().click();
    const markPaidDialog = page.getByRole("dialog", { name: "Mark payment paid" });
    await expect(markPaidDialog).toBeVisible();
    await expect(markPaidDialog.getByText(/Preview mode: marking paid is disabled/i)).toBeVisible();
    await expect(markPaidDialog.locator('input[name="paidAtLocal"]')).toBeVisible();
    await expect(markPaidDialog.getByRole("button", { name: "Confirm Paid" })).toBeDisabled();
    await markPaidDialog.getByRole("button", { name: "Close mark payment paid dialog" }).click();
    await expect(page.getByRole("dialog", { name: "Mark payment paid" })).toHaveCount(0);

    await page.getByRole("button", { name: /Cancel payment for/i }).first().click();
    const cancelDialog = page.getByRole("dialog", { name: "Cancel payment" });
    await expect(cancelDialog).toBeVisible();
    await expect(cancelDialog.getByText(/Preview mode: cancellation is disabled/i)).toBeVisible();
    await expect(cancelDialog.getByLabel("Cancellation reason")).toBeVisible();
    await expect(cancelDialog.getByRole("button", { name: "Confirm Cancellation" })).toBeDisabled();
    await expect(cancelDialog.getByLabel("Card number", { exact: true })).toHaveCount(0);
    await expect(cancelDialog.getByLabel("Bank account", { exact: true })).toHaveCount(0);
    await cancelDialog.getByRole("button", { name: "Close cancel payment dialog" }).click();
    await expect(page.getByRole("dialog", { name: "Cancel payment" })).toHaveCount(0);
  });

  test("renders repository-fed mock client packages without write or sensitive controls", async ({ page }) => {
    await page.goto("/client-packages");

    await expect(page.getByRole("heading", { name: "Client Packages", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Assign Package" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Client Alpha" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Intro Package" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Client" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Package" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Remaining" })).toBeVisible();
    await expect(page.getByText("2 / 2")).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /deduct/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /payment/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /clinical/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /whatsapp/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /contact/i })).toHaveCount(0);
  });

  test("opens a preview-safe assign package sheet without fake mock persistence", async ({ page }) => {
    await page.goto("/client-packages");

    await page.getByRole("button", { name: "Assign Package" }).click();
    const dialog = page.getByRole("dialog", { name: "Assign Package" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Client" })).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Package" })).toBeVisible();
    await expect(dialog.getByLabel("Purchase date and time")).toBeVisible();
    await dialog.getByRole("combobox", { name: "Package" }).selectOption({
      label: "Mock Intro Package",
    });
    await dialog.getByLabel("Purchase date and time").fill("2026-06-03T09:00");
    await expect(dialog.getByText("Total Sessions")).toBeVisible();
    await expect(dialog.getByText("Starting Remaining")).toBeVisible();
    await expect(dialog.getByText("2026-06-17")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Assign Package" }),
    ).toBeDisabled();
    await expect(dialog.getByText(/Preview mode: saving is disabled/i)).toBeVisible();
    await expect(dialog.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close package assignment form" }).click();
    await expect(page.getByRole("dialog", { name: "Assign Package" })).toHaveCount(0);
  });

  test("shows a deduct session control on completed appointments only", async ({ page }) => {
    await page.goto("/appointments");

    await expect(page.getByRole("heading", { name: "Appointments", exact: true })).toBeVisible();
    // Exactly one completed mock appointment exists, so exactly one deduct control.
    await expect(page.getByRole("button", { name: /Deduct session for/i })).toHaveCount(1);
  });

  test("opens a preview-safe deduct session dialog without fake mock persistence", async ({ page }) => {
    await page.goto("/appointments");

    await page.getByRole("button", { name: /Deduct session for/i }).click();
    const dialog = page.getByRole("dialog", { name: "Deduct Session" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Preview mode: deduction is disabled/i)).toBeVisible();
    await dialog.getByRole("combobox", { name: "Package" }).selectOption({ index: 1 });
    await expect(dialog.getByText("Remaining Before")).toBeVisible();
    await expect(dialog.getByText("Remaining After")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Deduct Session", exact: true }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close deduct session form" }).click();
    await expect(page.getByRole("dialog", { name: "Deduct Session" })).toHaveCount(0);
  });

  test("renders repository-fed mock appointments with eligible status actions only", async ({ page }) => {
    await page.goto("/appointments");

    await expect(page.getByRole("heading", { name: "Appointments", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Client Alpha" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Practitioner One" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mock Intro Assessment" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Schedule" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Client" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Practitioner" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Service" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /phone/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /email/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /contact/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /payment/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /clinical/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /whatsapp/i })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /package/i })).toHaveCount(0);
    await expect(page.getByText("Modified", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /reschedule appointment for/i })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /cancel appointment for/i })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /complete appointment for/i })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /mark no-show for/i })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
  });

  test("opens a preview-safe cancel appointment dialog without fake mock persistence", async ({ page }) => {
    await page.goto("/appointments");

    await page.getByRole("button", { name: /Cancel appointment for.*Mock Client Alpha/i }).click();
    await expect(page.getByRole("dialog", { name: "Cancel appointment" })).toBeVisible();
    await expect(page.getByLabel("Cancellation reason")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Cancellation" })).toBeDisabled();
    await expect(page.getByText(/Preview mode: cancellation is disabled/i)).toBeVisible();
    await expect(page.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Package", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Close cancel appointment form" }).click();
    await expect(page.getByRole("dialog", { name: "Cancel appointment" })).toHaveCount(0);
  });

  test("opens a preview-safe reschedule appointment dialog without fake mock persistence", async ({ page }) => {
    await page.goto("/appointments");

    await page.getByRole("button", { name: /Reschedule appointment for.*Mock Client Alpha/i }).click();
    await expect(page.getByRole("dialog", { name: "Reschedule appointment" })).toBeVisible();
    await expect(page.getByLabel("New start time")).toBeVisible();
    await expect(page.getByLabel("Reschedule duration")).toHaveValue("60 min");
    await expect(page.getByLabel("Reschedule duration")).toHaveAttribute("readonly", "");
    await expect(page.getByLabel("Reschedule reason")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Reschedule" })).toBeDisabled();
    await expect(page.getByText(/Preview mode: rescheduling is disabled/i)).toBeVisible();
    await expect(page.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Package", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Close reschedule appointment form" }).click();
    await expect(page.getByRole("dialog", { name: "Reschedule appointment" })).toHaveCount(0);
  });

  test("opens a preview-safe complete appointment dialog without fake mock persistence", async ({ page }) => {
    await page.goto("/appointments");

    await page.getByRole("button", { name: /Complete appointment for.*Mock Client Alpha/i }).click();
    await expect(page.getByRole("dialog", { name: "Complete appointment" })).toBeVisible();
    await expect(page.getByText(/Preview mode: completion is disabled/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Completion" })).toBeDisabled();
    await expect(page.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Package", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Close complete appointment form" }).click();
    await expect(page.getByRole("dialog", { name: "Complete appointment" })).toHaveCount(0);
  });

  test("opens a preview-safe no-show dialog without fake mock persistence", async ({ page }) => {
    await page.goto("/appointments");

    await page.getByRole("button", { name: /Mark no-show for.*Mock Client Alpha/i }).click();
    await expect(page.getByRole("dialog", { name: "Mark appointment no-show" })).toBeVisible();
    await expect(page.getByLabel("Optional no-show note")).toBeVisible();
    await expect(page.getByText(/Preview mode: no-show marking is disabled/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm No-show" })).toBeDisabled();
    await expect(page.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Package", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Close mark appointment no-show form" }).click();
    await expect(page.getByRole("dialog", { name: "Mark appointment no-show" })).toHaveCount(0);
  });

  test("opens a preview-safe create appointment sheet without fake mock persistence", async ({ page }) => {
    await page.goto("/appointments");

    await page.getByRole("button", { name: "New Appointment" }).click();
    await expect(page.getByRole("dialog", { name: "New Appointment" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Client" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Practitioner" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Service" })).toBeVisible();
    await expect(page.getByLabel("Start time")).toBeVisible();
    await expect(page.getByLabel("Source")).toHaveValue("admin");
    await expect(page.getByLabel("Source")).toHaveAttribute("readonly", "");
    await page.getByRole("combobox", { name: "Service" }).selectOption({
      label: "Mock Intro Assessment",
    });
    await expect(page.getByLabel("Duration")).toHaveValue("60 minutes");
    await expect(page.getByLabel("Duration")).toHaveAttribute("readonly", "");
    await expect(page.getByRole("button", { name: "Create Appointment" })).toBeDisabled();
    await expect(page.getByText(/Preview mode: saving is disabled/i)).toBeVisible();
    await expect(page.getByLabel("Phone", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Payment", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Clinical notes", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("WhatsApp", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Package", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Close appointment form" }).click();
    await expect(page.getByRole("dialog", { name: "New Appointment" })).toHaveCount(0);
  });
});
