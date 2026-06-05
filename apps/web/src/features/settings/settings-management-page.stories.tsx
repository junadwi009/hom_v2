import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mockAdminUsers } from "@hom/domain/users";

import { SettingsManagementPage } from "./settings-management-page";
import type { UserAdminActionState } from "./users-action-types";

const noopAction = async (): Promise<UserAdminActionState> => ({
  status: "idle",
});

const meta = {
  title: "Settings/SettingsManagementPage",
  component: SettingsManagementPage,
  args: {
    canManage: true,
    currentUserId: mockAdminUsers[0].id,
    createAction: noopAction,
    setRolesAction: noopAction,
    setStatusAction: noopAction,
    state: {
      status: "ready",
      dataMode: "supabase",
      users: [...mockAdminUsers],
    },
  },
} satisfies Meta<typeof SettingsManagementPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const ReadOnly: Story = {
  args: {
    canManage: false,
  },
};

export const LoadError: Story = {
  args: {
    state: {
      status: "error",
      dataMode: "supabase",
    },
  },
};

export const Empty: Story = {
  args: {
    state: {
      status: "ready",
      dataMode: "supabase",
      users: [],
    },
  },
};
