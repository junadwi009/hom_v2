import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreateUserSheet } from "./create-user-sheet";

const meta = {
  title: "Settings/CreateUserSheet",
  component: CreateUserSheet,
  args: {
    initialOpen: true,
    dataMode: "supabase",
    canManage: true,
  },
} satisfies Meta<typeof CreateUserSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const PreviewMode: Story = {
  args: {
    dataMode: "mock",
  },
};

export const EmailExists: Story = {
  args: {
    previewState: {
      status: "email_exists",
      message: "Email tersebut sudah terdaftar.",
    },
  },
};

export const ValidationError: Story = {
  args: {
    previewState: {
      status: "validation_error",
      message: "Periksa kembali data yang dimasukkan.",
    },
  },
};

export const Success: Story = {
  args: {
    initialOpen: false,
    previewState: {
      status: "success",
      message: "User berhasil dibuat.",
    },
  },
};
