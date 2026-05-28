import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", title: "Strategic Overview" },
  { path: "/dashboard/executive-command", title: "Strategic Overview" },
  { path: "/appointments", title: "Appointments" },
  { path: "/clients", title: "Clients" },
  { path: "/practitioners", title: "Practitioners" },
  { path: "/services", title: "Services" },
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
    await expect(page.getByRole("cell", { name: "Mock Client Alpha" })).toBeVisible();
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
});
