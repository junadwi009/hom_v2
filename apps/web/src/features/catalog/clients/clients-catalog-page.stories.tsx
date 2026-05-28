import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientsCatalogPage } from "./clients-catalog-page";
import type { ClientsPageState } from "./clients-page-state";

const readyState = {
  status: "ready",
  source: "mock",
  total: 3,
  pageSize: 20,
  rows: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Mock Client Alpha",
      status: "active",
      primaryPractitioner: "Mock Practitioner One",
      updated: "2026-05-27",
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      name: "Mock Client Beta",
      status: "prospect",
      primaryPractitioner: "Unassigned",
      updated: "2026-05-27",
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      name: "Mock Client Gamma",
      status: "inactive",
      primaryPractitioner: "Mock Practitioner Two",
      updated: "2026-05-27",
    },
  ],
} satisfies ClientsPageState;

const meta = {
  title: "Catalog/ClientsCatalogPage",
  component: ClientsCatalogPage,
  args: {
    state: readyState,
  },
} satisfies Meta<typeof ClientsCatalogPage>;

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
