import { createAttendanceAction } from "@/features/team-attendance/create-attendance-action";
import { loadTeamAttendanceData } from "@/features/team-attendance/team-attendance-loader";
import { TeamAttendancePage } from "@/features/team-attendance/team-attendance-page";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [data, currentUser] = await Promise.all([
    loadTeamAttendanceData(),
    getCurrentUser().catch(() => null),
  ]);

  const canCreate = Boolean(
    currentUser?.permissions.includes("can_manage_practitioners"),
  );

  return (
    <TeamAttendancePage
      canCreate={canCreate}
      createAction={createAttendanceAction}
      practitioners={data.practitioners}
      records={data.records}
    />
  );
}
