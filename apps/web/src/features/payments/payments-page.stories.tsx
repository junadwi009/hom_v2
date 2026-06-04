import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentsPage } from "./payments-page";
import type { PaymentsPageState } from "./payments-page-state";

const readyState = {
  status: "ready",
  source: "mock",
  total: 3,
  pageSize: 20,
  rows: [
    {
      id: "60000000-0000-4000-8000-000000000001",
      clientName: "Mock Client Alpha",
      packageName: "Mock Intro Package",
      amountIdr: "Rp 750.000",
      paymentMethod: "cash",
      status: "paid",
      paidAt: "2026-06-01",
      referenceNumber: "MOCK-PAY-0001",
      updated: "2026-06-01",
    },
    {
      id: "60000000-0000-4000-8000-000000000002",
      clientName: "Mock Client Beta",
      packageName: "—",
      amountIdr: "Rp 1.800.000",
      paymentMethod: "bank transfer",
      status: "pending",
      paidAt: "—",
      referenceNumber: "MOCK-PAY-0002",
      updated: "2026-06-01",
    },
    {
      id: "60000000-0000-4000-8000-000000000003",
      clientName: "Mock Client Gamma",
      packageName: "Mock Monthly Membership",
      amountIdr: "Rp 3.000.000",
      paymentMethod: "e wallet",
      status: "paid",
      paidAt: "2026-06-02",
      referenceNumber: "—",
      updated: "2026-06-02",
    },
  ],
} satisfies PaymentsPageState;

const meta = {
  title: "Payments/PaymentsPage",
  component: PaymentsPage,
  args: {
    state: readyState,
  },
} satisfies Meta<typeof PaymentsPage>;

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
