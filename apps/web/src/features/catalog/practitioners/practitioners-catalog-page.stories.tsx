import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PractitionersCatalogPage } from "./practitioners-catalog-page";
import type { PractitionersPageState } from "./practitioners-page-state";

const readyState = {
  status: "ready",
  source: "mock",
  total: 3,
  pageSize: 20,
  rows: [
    {
      id: "20000000-0000-4000-8000-000000000001",
      displayName: "Mock Practitioner One",
      status: "active",
      appProfile: "Linked",
      updated: "2026-05-27",
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      displayName: "Mock Practitioner Two",
      status: "active",
      appProfile: "Not linked",
      updated: "2026-05-27",
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      displayName: "Mock Practitioner Archived",
      status: "archived",
      appProfile: "Not linked",
      updated: "2026-05-27",
    },
  ],
} satisfies PractitionersPageState;

const meta = {
  title: "Catalog/PractitionersCatalogPage",
  component: PractitionersCatalogPage,
  args: {
    state: readyState,
  },
} satisfies Meta<typeof PractitionersCatalogPage>;

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
