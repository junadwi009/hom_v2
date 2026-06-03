import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Client } from "@hom/domain/clients";
import type { ClientPackage, Package } from "@hom/domain/packages";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  calculateExpiryDateLabel,
} from "../../../src/features/packages/client-packages/assign-client-package-sheet";
import { loadAssignClientPackageOptions } from "../../../src/features/packages/client-packages/assign-client-package-options-loader";
import {
  submitAssignClientPackageFormData,
  toAssignClientPackageInput,
  toSafeAssignClientPackageActionState,
} from "../../../src/lib/packages/server/submit-assign-client-package";
import { AssignClientPackageRpcError } from "../../../src/lib/packages/server/assign-client-package";
import { PackageRepositoryError } from "../../../src/lib/packages/errors";

const activeClient = {
  id: "10000000-0000-4000-8000-000000000001",
  fullName: "Mock Client Alpha",
  status: "active",
  primaryPractitionerId: null,
  primaryPractitionerName: null,
  maskedPhone: null,
  maskedEmail: null,
  createdByAppUserId: null,
  createdAt: "2026-06-03T01:00:00.000Z",
  updatedAt: "2026-06-03T01:00:00.000Z",
} satisfies Client;

const archivedClient = {
  ...activeClient,
  id: "10000000-0000-4000-8000-000000000002",
  fullName: "Mock Archived Client",
  status: "archived",
} satisfies Client;

const activePackage = {
  id: "50000000-0000-4000-8000-000000000001",
  name: "Mock Intro Package",
  packageType: "intro",
  totalSessions: 2,
  validityDays: 14,
  priceIdr: 750000,
  status: "active",
  createdAt: "2026-06-03T01:00:00.000Z",
  updatedAt: "2026-06-03T01:00:00.000Z",
} satisfies Package;

const inactivePackage = {
  ...activePackage,
  id: "50000000-0000-4000-8000-000000000002",
  name: "Mock Inactive Package",
  status: "inactive",
} satisfies Package;

const assignedClientPackage = {
  id: "51000000-0000-4000-8000-000000000001",
  clientId: activeClient.id,
  clientName: activeClient.fullName,
  packageId: activePackage.id,
  packageName: activePackage.name,
  purchasedAt: "2026-06-03T02:00:00.000Z",
  expiresAt: "2026-06-17T02:00:00.000Z",
  totalSessions: 2,
  remainingSessions: 2,
  status: "active",
  createdAt: "2026-06-03T02:00:00.000Z",
  updatedAt: "2026-06-03T02:00:00.000Z",
} satisfies ClientPackage;

describe("assign package options", () => {
  it("loads eligible clients and active packages without sensitive fields", async () => {
    const state = await loadAssignClientPackageOptions({
      dataMode: "mock",
      repositories: {
        clients: createClientRepository([activeClient, archivedClient]),
        packages: createPackageRepository([activePackage, inactivePackage]),
      },
    });

    expect(state.status).toBe("ready");
    if (state.status === "ready") {
      expect(state.options.clients).toEqual([
        {
          id: activeClient.id,
          label: activeClient.fullName,
          status: "active",
        },
      ]);
      expect(state.options.packages).toEqual([
        {
          id: activePackage.id,
          label: activePackage.name,
          packageType: "intro",
          totalSessions: 2,
          validityDays: 14,
          priceIdr: 750000,
          status: "active",
        },
      ]);
      expect(JSON.stringify(state.options)).not.toMatch(
        /phone|email|payment|clinical|whatsapp|contact/i,
      );
    }
  });

  it("maps permission and configuration errors safely", async () => {
    await expect(
      loadAssignClientPackageOptions({
        dataMode: "supabase",
        repositories: {
          clients: createClientRepository([activeClient]),
          packages: {
            async list() {
              throw new PackageRepositoryError({
                operation: "packages.list",
                table: "packages",
                code: "42501",
              });
            },
            async getById() {
              return null;
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      status: "permission_denied",
      dataMode: "supabase",
    });

    await expect(
      loadAssignClientPackageOptions({
        dataMode: "supabase",
        repositories: {
          clients: {
            async list() {
              throw new Error(
                "Supabase public environment variables are missing",
              );
            },
            async getById() {
              return null;
            },
          },
          packages: createPackageRepository([activePackage]),
        },
      }),
    ).resolves.toMatchObject({
      status: "configuration_error",
      dataMode: "supabase",
    });
  });
});

describe("assign package form submission", () => {
  it("maps form data to assign input and ignores sensitive fields", () => {
    const formData = createValidFormData();
    formData.set("payment", "mock payment");
    formData.set("phone", "+62 000-0000-0001");
    formData.set("clinicalNotes", "mock clinical");
    formData.set("whatsappMessage", "mock WhatsApp");

    const input = toAssignClientPackageInput(formData);

    expect(input).toEqual({
      clientId: activeClient.id,
      packageId: activePackage.id,
      purchasedAt: "2026-06-03T02:00:00.000Z",
    });
    expect(Object.keys(input).sort()).toEqual([
      "clientId",
      "packageId",
      "purchasedAt",
    ]);
  });

  it("does not fake success in mock mode", async () => {
    const assignPackage = vi.fn(async () => assignedClientPackage);

    await expect(
      submitAssignClientPackageFormData(createValidFormData(), {
        dataMode: "mock",
        assignPackage,
      }),
    ).resolves.toEqual({
      status: "configuration_error",
      message: "Saving is unavailable in mock preview mode.",
    });
    expect(assignPackage).not.toHaveBeenCalled();
  });

  it("returns success only after the server adapter succeeds", async () => {
    const assignPackage = vi.fn(async () => assignedClientPackage);

    await expect(
      submitAssignClientPackageFormData(createValidFormData(), {
        dataMode: "supabase",
        authMode: "supabase",
        assignPackage,
      }),
    ).resolves.toEqual({
      status: "success",
      clientPackageId: assignedClientPackage.id,
      message: "Package assigned.",
    });
  });

  it("maps unavailable and permission failures without raw details", () => {
    expect(
      toSafeAssignClientPackageActionState(
        new AssignClientPackageRpcError("PACKAGE_UNAVAILABLE"),
      ),
    ).toEqual({
      status: "package_unavailable",
      message: "Choose an active package and try again.",
    });
    expect(
      toSafeAssignClientPackageActionState(
        new AssignClientPackageRpcError("PERMISSION_DENIED"),
      ),
    ).toEqual({
      status: "permission_denied",
      message: "You do not have permission to assign packages.",
    });
  });

  it("previews expiry dates and avoids sensitive form fields", () => {
    expect(calculateExpiryDateLabel("2026-06-03T09:00", 14)).toBe(
      "2026-06-17",
    );

    const source = readWorkspaceFile(
      "apps/web/src/features/packages/client-packages/assign-client-package-sheet.tsx",
    );

    expect(source).toContain("Assignment Preview");
    expect(source).toContain("Starting Remaining");
    expect(source).not.toContain('name="payment"');
    expect(source).not.toContain('name="phone"');
    expect(source).not.toContain('name="email"');
    expect(source).not.toContain('name="clinical');
    expect(source).not.toContain('name="whatsapp');
  });
});

function createValidFormData() {
  const formData = new FormData();
  formData.set("clientId", activeClient.id);
  formData.set("packageId", activePackage.id);
  formData.set("purchasedAtLocal", "2026-06-03T09:00");

  return formData;
}

function createClientRepository(items: Client[]) {
  return {
    async list() {
      return {
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
      };
    },
    async getById(id: string) {
      return items.find((item) => item.id === id) ?? null;
    },
  };
}

function createPackageRepository(items: Package[]) {
  return {
    async list() {
      return {
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
      };
    },
    async getById(id: string) {
      return items.find((item) => item.id === id) ?? null;
    },
  };
}

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
