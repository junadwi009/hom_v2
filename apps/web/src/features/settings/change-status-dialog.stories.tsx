import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mockAdminUsers } from "@hom/domain/users";

import { ChangeStatusDialog } from "./change-status-dialog";
import type { UserAdminActionState } from "./users-action-types";

const noopAction = async (): Promise<UserAdminActionState> => ({
  status: "idle",
});

const meta = {
  title: "Settings/ChangeStatusDialog",
  component: ChangeStatusDialog,
  args: {
    user: mockAdminUsers[2],
    action: noopAction,
    onClose: () => {},
  },
} satisfies Meta<typeof ChangeStatusDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
