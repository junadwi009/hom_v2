import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiBusinessAgentPage } from "./ai-business-agent-page";

const meta = {
  title: "AiBusinessAgent/AiBusinessAgentPage",
  component: AiBusinessAgentPage,
  args: { canUse: true, source: "supabase" },
} satisfies Meta<typeof AiBusinessAgentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const PermissionDenied: Story = {
  args: { canUse: false, source: "supabase" },
};

export const MockPreview: Story = {
  args: { canUse: true, source: "mock" },
};
