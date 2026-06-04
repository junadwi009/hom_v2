import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DeductSessionDialog } from "./deduct-session-dialog";
import type { DeductSessionOptionsState } from "./deduct-session-types";

const readyOptionsState = {
  status: "ready",
  dataMode: "supabase",
  alreadyDeducted: false,
  packages: [
    {
      id: "51000000-0000-4000-8000-000000000001",
      packageName: "Mock Intro Package",
      remainingSessions: 2,
      totalSessions: 2,
      expiresAt: "2026-06-17T02:00:00.000Z",
    },
    {
      id: "51000000-0000-4000-8000-000000000002",
      packageName: "Mock 4 Session Pack",
      remainingSessions: 3,
      totalSessions: 4,
      expiresAt: "2026-07-19T02:00:00.000Z",
    },
  ],
} satisfies DeductSessionOptionsState;

const meta = {
  title: "Appointments/DeductSessionDialog",
  component: DeductSessionDialog,
  args: {
    appointmentId: "40000000-0000-4000-8000-000000000003",
    appointmentLabel: "31 May 2026, 10:00 - Mock Client Alpha",
    canDeductSession: true,
    dataMode: "supabase",
    initialOpen: true,
    optionsState: readyOptionsState,
  },
} satisfies Meta<typeof DeductSessionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const MockPreview: Story = {
  args: {
    dataMode: "mock",
    optionsState: { ...readyOptionsState, dataMode: "mock" },
  },
};

export const NoEligiblePackage: Story = {
  args: {
    optionsState: {
      status: "ready",
      dataMode: "supabase",
      alreadyDeducted: false,
      packages: [],
    },
  },
};

export const AlreadyDeducted: Story = {
  args: {
    optionsState: {
      status: "ready",
      dataMode: "supabase",
      alreadyDeducted: true,
      packages: [],
    },
  },
};

export const PackageUnavailable: Story = {
  args: {
    previewState: {
      status: "package_unavailable",
      message: "Choose an eligible active package and try again.",
    },
  },
};

export const AppointmentNotCompleted: Story = {
  args: {
    previewState: {
      status: "appointment_not_completed",
      message: "Only a completed appointment can deduct a session.",
    },
  },
};

export const PermissionDenied: Story = {
  args: {
    optionsState: { status: "permission_denied", dataMode: "supabase" },
  },
};

export const ConfigurationError: Story = {
  args: {
    optionsState: { status: "configuration_error", dataMode: "supabase" },
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
      message: "Session deducted.",
    },
  },
};
