import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";

function StateGallery() {
  return (
    <div className="grid max-w-5xl gap-4 md:grid-cols-2">
      <LoadingSkeleton />
      <EmptyState title="No records yet" description="This reusable state appears before records are created." />
      <ErrorState title="Could not load mock data" description="Real retry behavior will be wired after APIs exist." />
      <PermissionDeniedState />
    </div>
  );
}

const meta = {
  title: "Feedback/ScreenStates",
  component: StateGallery,
} satisfies Meta<typeof StateGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
