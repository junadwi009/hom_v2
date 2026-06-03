import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientPackagesPage } from "./client-packages-page";
import type { AssignClientPackageOptionsState } from "./assign-client-package-types";
import type { ClientPackagesPageState } from "./client-packages-page-state";

const readyState = {
  status: "ready",
  source: "mock",
  total: 3,
  pageSize: 20,
  rows: [
    {
      id: "51000000-0000-4000-8000-000000000001",
      clientName: "Mock Client Alpha",
      packageName: "Mock Intro Package",
      purchasedAt: "2026-06-03",
      expiresAt: "2026-06-17",
      totalSessions: "2",
      remainingSessions: "2 / 2",
      status: "active",
      updated: "2026-06-03",
    },
    {
      id: "51000000-0000-4000-8000-000000000002",
      clientName: "Mock Client Beta",
      packageName: "Mock 4 Session Pack",
      purchasedAt: "2026-06-04",
      expiresAt: "2026-07-19",
      totalSessions: "4",
      remainingSessions: "4 / 4",
      status: "active",
      updated: "2026-06-04",
    },
    {
      id: "51000000-0000-4000-8000-000000000003",
      clientName: "Mock Client Gamma",
      packageName: "Mock Monthly Membership",
      purchasedAt: "2026-04-01",
      expiresAt: "2026-05-01",
      totalSessions: "8",
      remainingSessions: "8 / 8",
      status: "expired",
      updated: "2026-05-01",
    },
  ],
} satisfies ClientPackagesPageState;

const assignmentOptionsState = {
  status: "ready",
  dataMode: "mock",
  options: {
    clients: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        label: "Mock Client Alpha",
        status: "active",
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        label: "Mock Client Beta",
        status: "prospect",
      },
    ],
    packages: [
      {
        id: "50000000-0000-4000-8000-000000000001",
        label: "Mock Intro Package",
        packageType: "intro",
        totalSessions: 2,
        validityDays: 14,
        priceIdr: 750000,
        status: "active",
      },
      {
        id: "50000000-0000-4000-8000-000000000002",
        label: "Mock 4 Session Pack",
        packageType: "session_pack",
        totalSessions: 4,
        validityDays: 45,
        priceIdr: 1800000,
        status: "active",
      },
    ],
  },
} satisfies AssignClientPackageOptionsState;

const meta = {
  title: "Packages/ClientPackagesPage",
  component: ClientPackagesPage,
  args: {
    assignmentOptionsState,
    canAssignPackage: true,
    state: readyState,
  },
} satisfies Meta<typeof ClientPackagesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Empty: Story = {
  args: {
    state: {
      status: "empty",
      source: "mock",
    },
  },
};

export const PermissionDenied: Story = {
  args: {
    state: {
      status: "permission_denied",
      source: "supabase",
    },
  },
};

export const GenericError: Story = {
  args: {
    state: {
      status: "error",
      source: "mock",
    },
  },
};

export const ConfigurationError: Story = {
  args: {
    state: {
      status: "configuration_error",
      source: "supabase",
    },
  },
};
