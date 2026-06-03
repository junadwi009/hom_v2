import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreateAppointmentSheet } from "./create-appointment-sheet";
import type { CreateAppointmentOptionsState } from "./create-appointment-types";

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
    ],
    practitioners: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        label: "Mock Practitioner One",
        status: "active",
      },
    ],
    services: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        label: "Mock Intro Assessment",
        status: "active",
        durationMinutes: 60,
      },
    ],
  },
} satisfies CreateAppointmentOptionsState;

const meta = {
  title: "Appointments/CreateAppointmentSheet",
  component: CreateAppointmentSheet,
  args: {
    initialOpen: true,
    optionsState,
  },
} satisfies Meta<typeof CreateAppointmentSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const ValidationError: Story = {
  args: {
    previewState: {
      status: "validation_error",
      message: "Check the appointment details and try again.",
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
      message: "You do not have permission to create appointments.",
    },
  },
};

export const ConfigurationError: Story = {
  args: {
    previewState: {
      status: "configuration_error",
      message: "Local Supabase configuration is unavailable.",
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
    initialOpen: false,
    previewState: {
      status: "success",
      message: "Appointment created.",
    },
  },
};
