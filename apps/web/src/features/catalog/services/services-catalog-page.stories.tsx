import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ServicesCatalogPage } from "./services-catalog-page";
import type { ServicesPageState } from "./services-page-state";

const readyState = {
  status: "ready",
  source: "mock",
  total: 3,
  pageSize: 20,
  rows: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      name: "Mock Intro Assessment",
      category: "assessment",
      duration: "60 min",
      defaultPriceIdr: "Rp 450.000",
      status: "active",
      updated: "2026-05-27",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      name: "Mock Private Session",
      category: "private_session",
      duration: "50 min",
      defaultPriceIdr: "Rp 550.000",
      status: "active",
      updated: "2026-05-27",
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      name: "Mock Archived Service",
      category: "archive_only",
      duration: "45 min",
      defaultPriceIdr: "Not set",
      status: "archived",
      updated: "2026-05-27",
    },
  ],
} satisfies ServicesPageState;

const meta = {
  title: "Catalog/ServicesCatalogPage",
  component: ServicesCatalogPage,
  args: {
    state: readyState,
  },
} satisfies Meta<typeof ServicesCatalogPage>;

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
