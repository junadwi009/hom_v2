import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreatePaymentSheet } from "./create-payment-sheet";
import type { CreatePaymentOptionsState } from "./create-payment-types";

const optionsState = {
  status: "ready",
  dataMode: "supabase",
  options: {
    clients: [
      { id: "10000000-0000-4000-8000-000000000001", label: "Mock Client Alpha" },
      { id: "10000000-0000-4000-8000-000000000002", label: "Mock Client Beta" },
    ],
    clientPackages: [
      {
        id: "51000000-0000-4000-8000-000000000001",
        clientId: "10000000-0000-4000-8000-000000000001",
        label: "Mock Intro Package (active)",
      },
      {
        id: "51000000-0000-4000-8000-000000000003",
        clientId: "10000000-0000-4000-8000-000000000002",
        label: "Mock 4 Session Pack (active)",
      },
    ],
  },
} satisfies CreatePaymentOptionsState;

const meta = {
  title: "Payments/CreatePaymentSheet",
  component: CreatePaymentSheet,
  args: {
    canCreatePayment: true,
    initialOpen: true,
    optionsState,
  },
} satisfies Meta<typeof CreatePaymentSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const MockPreview: Story = {
  args: {
    optionsState: { ...optionsState, dataMode: "mock" },
  },
};

export const ValidationError: Story = {
  args: {
    previewState: {
      status: "validation_error",
      message: "Check the payment details and try again.",
    },
  },
};

export const UnavailableClient: Story = {
  args: {
    previewState: {
      status: "client_unavailable",
      message: "Choose an eligible client and try again.",
    },
  },
};

export const UnavailableClientPackage: Story = {
  args: {
    previewState: {
      status: "client_package_unavailable",
      message: "Choose a package that belongs to the client.",
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
      paymentId: "60000000-0000-4000-8000-0000000000aa",
      message: "Payment created.",
    },
  },
};
