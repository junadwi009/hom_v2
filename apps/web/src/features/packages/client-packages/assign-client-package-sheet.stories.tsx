import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AssignClientPackageSheet } from "./assign-client-package-sheet";
import type { AssignClientPackageOptionsState } from "./assign-client-package-types";

const optionsState = {
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
  title: "Packages/AssignClientPackageSheet",
  component: AssignClientPackageSheet,
  args: {
    canAssignPackage: true,
    initialOpen: true,
    optionsState,
  },
} satisfies Meta<typeof AssignClientPackageSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const ValidationError: Story = {
  args: {
    previewState: {
      status: "validation_error",
      message: "Check the package assignment details and try again.",
    },
  },
};

export const UnavailablePackage: Story = {
  args: {
    previewState: {
      status: "package_unavailable",
      message: "Choose an active package and try again.",
    },
  },
};

export const PermissionDenied: Story = {
  args: {
    previewState: {
      status: "permission_denied",
      message: "You do not have permission to assign packages.",
    },
  },
};

export const ConfigurationError: Story = {
  args: {
    previewState: {
      status: "configuration_error",
      message: "Saving is unavailable in mock preview mode.",
    },
  },
};

export const Submitting: Story = {
  args: {
    previewSubmitting: true,
  },
};

export const Success: Story = {
  args: {
    previewState: {
      status: "success",
      clientPackageId: "51000000-0000-4000-8000-000000000001",
      message: "Package assigned.",
    },
  },
};
