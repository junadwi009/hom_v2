import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DecisionOverviewPage } from "./decision-overview-page";

const meta = {
  title: "Overview/DecisionOverviewPage",
  component: DecisionOverviewPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DecisionOverviewPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
