import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PackagesPage } from "./packages-page";
import type { PackagesPageState } from "./packages-page-state";

const readyState = {
  status: "ready",
  source: "mock",
  total: 3,
  pageSize: 20,
  rows: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      name: "Mock Intro Package",
      packageType: "intro",
      totalSessions: "2",
      validityDays: "14 days",
      priceIdr: "Rp 750.000",
      status: "active",
      updated: "2026-06-03",
    },
    {
      id: "50000000-0000-4000-8000-000000000002",
      name: "Mock 4 Session Pack",
      packageType: "session pack",
      totalSessions: "4",
      validityDays: "45 days",
      priceIdr: "Rp 1.800.000",
      status: "active",
      updated: "2026-06-03",
    },
    {
      id: "50000000-0000-4000-8000-000000000003",
      name: "Mock Archived Package",
      packageType: "membership",
      totalSessions: "8",
      validityDays: "30 days",
      priceIdr: "Rp 3.000.000",
      status: "archived",
      updated: "2026-06-03",
    },
  ],
} satisfies PackagesPageState;

const meta = {
  title: "Packages/PackagesPage",
  component: PackagesPage,
  args: {
    state: readyState,
  },
} satisfies Meta<typeof PackagesPage>;

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
