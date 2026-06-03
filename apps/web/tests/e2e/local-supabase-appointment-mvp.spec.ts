import { expect, test, type Page } from "@playwright/test";

const runLocalSupabase = process.env.HOM_E2E_LOCAL_SUPABASE === "1";
const localFixtureEmail = process.env.HOM_E2E_LOCAL_AUTH_EMAIL;
const localFixturePassword = process.env.HOM_E2E_LOCAL_AUTH_PASSWORD;

test.describe("local Supabase appointment MVP", () => {
  test.skip(
    !runLocalSupabase,
    "Enable explicitly for the local-only Supabase demo verification.",
  );

  test("studio director completes the appointment MVP workflow", async ({
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
      },
    });

    await page.goto("/appointments");
    await expect(
      page.getByRole("heading", { name: "Appointments", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "New Appointment" })).toBeEnabled();

    await createAppointment(page, {
      clientId: "10000000-0000-4000-8000-000000000032",
      practitionerId: "20000000-0000-4000-8000-000000000007",
      serviceId: "30000000-0000-4000-8000-000000000006",
      startsAtLocal: "2036-07-20T09:00",
      summary: "Mock Phase 4P demo appointment.",
    });
    await expect(rowFor(page, "Mock Client 032")).toContainText("scheduled", {
      timeout: 20_000,
    });

    await createAppointment(page, {
      clientId: "10000000-0000-4000-8000-000000000034",
      practitionerId: "20000000-0000-4000-8000-000000000007",
      serviceId: "30000000-0000-4000-8000-000000000006",
      startsAtLocal: "2036-07-20T09:15",
      summary: "Mock overlap verification.",
      expectOverlap: true,
    });

    const createdRow = rowFor(page, "Mock Client 032");
    await createdRow
      .getByRole("button", { name: /Reschedule appointment for/ })
      .click();
    await page.getByLabel("New start time").fill("2036-07-20T11:00");
    await page.getByLabel("Reschedule reason").fill("Mock demo time change.");
    await page.getByRole("button", { name: "Confirm Reschedule" }).click();
    await expect(rowFor(page, "Mock Client 032")).toContainText("11:00", {
      timeout: 20_000,
    });
    await expect(rowFor(page, "Mock Client 032")).toContainText("Modified");

    await cancelAppointment(page, "Mock Client 038");
    await expect(rowFor(page, "Mock Client 038")).toContainText("cancelled", {
      timeout: 20_000,
    });

    await completeAppointment(page, "Mock Client 039");
    await expect(rowFor(page, "Mock Client 039")).toContainText("completed", {
      timeout: 20_000,
    });

    await markNoShow(page, "Mock Client 031");
    await expect(rowFor(page, "Mock Client 031")).toContainText("no show", {
      timeout: 20_000,
    });
  });
});

async function createAppointment(
  page: Page,
  input: {
    clientId: string;
    practitionerId: string;
    serviceId: string;
    startsAtLocal: string;
    summary: string;
    expectOverlap?: boolean;
  },
) {
  await page.getByRole("button", { name: "New Appointment" }).click();
  await page.locator('select[name="clientId"]').selectOption(input.clientId);
  await page
    .locator('select[name="practitionerId"]')
    .selectOption(input.practitionerId);
  await page.locator('select[name="serviceId"]').selectOption(input.serviceId);
  await page.getByLabel("Start time").fill(input.startsAtLocal);
  await page.getByLabel("Operational summary").fill(input.summary);
  await page.getByRole("button", { name: "Create Appointment" }).click();

  if (input.expectOverlap) {
    await expect(
      page.getByText(
        "This practitioner already has an appointment during that time.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close appointment form" }).click();
  }
}

async function cancelAppointment(page: Page, clientName: string) {
  await rowFor(page, clientName)
    .getByRole("button", { name: /Cancel appointment for/ })
    .click();
  await page.getByLabel("Cancellation reason").fill("Mock demo cancellation.");
  await page.getByRole("button", { name: "Confirm Cancellation" }).click();
}

async function completeAppointment(page: Page, clientName: string) {
  await rowFor(page, clientName)
    .getByRole("button", { name: /Complete appointment for/ })
    .click();
  await page.getByRole("button", { name: "Confirm Completion" }).click();
}

async function markNoShow(page: Page, clientName: string) {
  await rowFor(page, clientName)
    .getByRole("button", { name: /Mark no-show for/ })
    .click();
  await page.getByLabel("Optional no-show note").fill("Mock demo no-show.");
  await page.getByRole("button", { name: "Confirm No-show" }).click();
}

function rowFor(page: Page, clientName: string) {
  return page.getByRole("row").filter({ hasText: clientName });
}
