import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mockAdminUsers } from "@hom/domain/users";

import { EditRolesDialog } from "./edit-roles-dialog";
import type { UserAdminActionState } from "./users-action-types";

const noopAction = async (): Promise<UserAdminActionState> => ({
  status: "idle",
});

const meta = {
  title: "Settings/EditRolesDialog",
  component: EditRolesDialog,
  args: {
    user: mockAdminUsers[1],
    action: noopAction,
    onClose: () => {},
  },
} satisfies Meta<typeof EditRolesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
