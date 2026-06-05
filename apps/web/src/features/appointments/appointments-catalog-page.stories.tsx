import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppointmentsCatalogPage } from "./appointments-catalog-page";
import type { AppointmentsPageState } from "./appointments-page-state";
import type { CreateAppointmentOptionsState } from "./create-appointment-types";

const readyState = {
  status: "ready",
  source: "mock",
  total: 2,
  pageSize: 20,
  rows: [
    {
      id: "40000000-0000-4000-8000-000000000001",
      clientId: "10000000-0000-4000-8000-000000000001",
      scheduled: "01 Jun 2026, 10:00",
      startsAt: "2026-06-01T03:00:00.000Z",
      clientName: "Mock Client Alpha",
      practitionerName: "Mock Practitioner One",
      serviceName: "Mock Intro Assessment",
      duration: "60 min",
      isModified: false,
      status: "scheduled",
      source: "admin",
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      clientId: "10000000-0000-4000-8000-000000000002",
      scheduled: "01 Jun 2026, 12:00",
      startsAt: "2026-06-01T05:00:00.000Z",
      clientName: "Mock Client Beta",
      practitionerName: "Mock Practitioner Two",
      serviceName: "Mock Private Session",
      duration: "50 min",
      isModified: true,
      status: "confirmed",
      source: "import",
    },
  ],
} satisfies AppointmentsPageState;

const createOptionsState = {
  status: "ready",
  dataMode: "mock",
  options: {
    clients: [],
    practitioners: [],
    services: [],
  },
} satisfies CreateAppointmentOptionsState;

const meta = {
  title: "Appointments/AppointmentsCatalogPage",
  component: AppointmentsCatalogPage,
  args: {
    createOptionsState,
    state: readyState,
  },
} satisfies Meta<typeof AppointmentsCatalogPage>;

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

export const ConfigurationError: Story = {
  args: {
    state: {
      status: "configuration_error",
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
