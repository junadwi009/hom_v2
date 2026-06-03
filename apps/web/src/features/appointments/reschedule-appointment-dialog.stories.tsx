import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RescheduleAppointmentDialog } from "./reschedule-appointment-dialog";

const meta = {
  title: "Appointments/RescheduleAppointmentDialog",
  component: RescheduleAppointmentDialog,
  args: {
    appointmentId: "40000000-0000-4000-8000-000000000001",
    appointmentLabel: "01 Jun 2026, 10:00 - Mock Client Alpha",
    dataMode: "mock",
    duration: "60 min",
    initialOpen: true,
  },
} satisfies Meta<typeof RescheduleAppointmentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const ValidationError: Story = {
  args: {
    previewState: {
      status: "validation_error",
      message: "Choose a future start time and enter a reason within 280 characters.",
    },
  },
};

export const Overlap: Story = {
  args: {
    previewState: {
      status: "appointment_overlap",
      message: "This practitioner already has an appointment during that time.",
    },
  },
};

export const PermissionDenied: Story = {
  args: {
    previewState: {
      status: "permission_denied",
      message: "You do not have permission to reschedule appointments.",
    },
  },
};

export const AppointmentUnavailable: Story = {
  args: {
    previewState: {
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be rescheduled.",
    },
  },
};

export const Submitting: Story = {
  args: {
    previewSubmitting: true,
  },
};
