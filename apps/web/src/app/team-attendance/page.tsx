import { ModuleMockPage } from "@/features/module-page/module-mock-page";
import { modulePages } from "@/lib/mock-data";

export default function TeamAttendancePage() {
  return (
    <ModuleMockPage
      {...modulePages.appointments}
      eyebrow="Team"
      title="Team Attendance"
      description="Mock attendance shell for future practitioner presence and utilization workflows."
    />
  );
}
