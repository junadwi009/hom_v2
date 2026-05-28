import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  args: {
    eyebrow: "Executive Command",
    title: "Strategic Overview",
    description:
      "Operational foundation first: attention items, safe mock metrics, and review queues before production dashboards.",
    actions: (
      <>
        <Button type="button" variant="secondary">Mock period</Button>
        <Button type="button">Open approvals</Button>
      </>
    ),
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
