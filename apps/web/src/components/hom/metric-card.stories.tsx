import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetricCard } from "@/components/hom/metric-card";

const meta = {
  title: "HOM/MetricCard",
  component: MetricCard,
  parameters: {
    layout: "centered",
  },
  args: {
    label: "Monthly Revenue",
    value: "Rp 184.2M",
    helper: "Mock May 2026 period",
    trend: "+12.4%",
    tone: "success",
  },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Warning: Story = {
  args: {
    label: "Pending Approvals",
    value: "9",
    helper: "Needs owner review",
    trend: "review",
    tone: "warning",
  },
};

export const LongText: Story = {
  args: {
    label: "Open Chat Interventions Waiting For Human Review",
    value: "14",
    helper: "AI drafts are not auto-sent in this phase",
    trend: "draft only",
    tone: "info",
  },
};
