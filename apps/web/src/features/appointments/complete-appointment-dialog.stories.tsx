import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CompleteAppointmentDialog } from "./complete-appointment-dialog";

const meta = {
  title: "Appointments/CompleteAppointmentDialog",
  component: CompleteAppointmentDialog,
  args: {
    appointmentId: "40000000-0000-4000-8000-000000000001",
    appointmentLabel: "01 Jun 2026, 10:00 - Mock Client Alpha",
    dataMode: "mock",
    initialOpen: true,
  },
} satisfies Meta<typeof CompleteAppointmentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const PermissionDenied: Story = {
  args: {
    previewState: {
      status: "permission_denied",
      message: "You do not have permission to complete appointments.",
    },
  },
};

export const AppointmentUnavailable: Story = {
  args: {
    previewState: {
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be completed.",
    },
  },
};

export const Submitting: Story = {
  args: {
    previewSubmitting: true,
  },
};
