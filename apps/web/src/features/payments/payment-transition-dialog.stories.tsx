import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentTransitionDialog } from "./payment-transition-dialog";

const meta = {
  title: "Payments/PaymentTransitionDialog",
  component: PaymentTransitionDialog,
  args: {
    canManagePayment: true,
    dataMode: "supabase",
    initialOpen: true,
    kind: "mark_paid",
    paymentId: "60000000-0000-4000-8000-000000000002",
    paymentLabel: "Mock Client Beta · Rp 1.800.000",
  },
} satisfies Meta<typeof PaymentTransitionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarkPaidReady: Story = {};

export const MarkPaidMockPreview: Story = {
  args: { dataMode: "mock" },
};

export const CancelReady: Story = {
  args: { kind: "cancel" },
};

export const CancelMockPreview: Story = {
  args: { kind: "cancel", dataMode: "mock" },
};

export const InvalidTransition: Story = {
  args: {
    previewState: {
      status: "invalid_transition",
      message: "Only a pending payment can be marked paid.",
    },
  },
};

export const PaymentUnavailable: Story = {
  args: {
    previewState: {
      status: "payment_unavailable",
      message: "This payment is no longer available.",
    },
  },
};

export const PermissionDenied: Story = {
  args: {
    previewState: {
      status: "permission_denied",
      message: "You do not have permission to change payments.",
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
  args: { previewSubmitting: true },
};

export const Success: Story = {
  args: {
    previewState: {
      status: "success",
      paymentId: "60000000-0000-4000-8000-000000000002",
      message: "Payment marked paid.",
    },
  },
};
