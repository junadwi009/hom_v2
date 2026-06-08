import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { CreateAttendanceSheet } from "./create-attendance-sheet";
import type { CreateAttendanceFormAction } from "./create-attendance-types";
import type {
  AttendanceRecordView,
  PractitionerOption,
} from "./team-attendance-loader";

const statusTone: Record<
  AttendanceRecordView["status"],
  "success" | "warning" | "danger" | "info"
> = {
  present: "success",
  late: "warning",
  leave: "info",
  absent: "danger",
};

const statusLabel: Record<AttendanceRecordView["status"], string> = {
  present: "Present",
  late: "Late",
  leave: "Leave",
  absent: "Absent",
};

export function TeamAttendancePage({
  records,
  practitioners,
  createAction,
  canCreate = false,
}: {
  records: AttendanceRecordView[];
  practitioners: PractitionerOption[];
  createAction?: CreateAttendanceFormAction;
  canCreate?: boolean;
}) {
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Team Attendance"
        description="Catatan kehadiran harian practitioner yang tersimpan ke database studio."
        actions={
          createAction ? (
            <CreateAttendanceSheet
              action={createAction}
              canCreate={canCreate}
              practitioners={practitioners}
            />
          ) : undefined
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Catatan"
          value={String(records.length)}
          helper="50 terbaru"
          trend="records"
          tone="info"
        />
        <MetricCard
          label="Hadir"
          value={String(presentCount)}
          helper="status present"
          trend="present"
          tone="success"
        />
        <MetricCard
          label="Tidak Hadir"
          value={String(absentCount)}
          helper="status absent"
          trend="absent"
          tone={absentCount > 0 ? "danger" : "neutral"}
        />
      </section>

      <DashboardCard
        title="Riwayat Absensi"
        description="50 catatan terbaru berdasarkan tanggal."
      >
        {records.length === 0 ? (
          <EmptyState
            title="Belum ada catatan absensi"
            description="Catat kehadiran pertama lewat tombol Catat Absensi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-normal text-foreground-muted">
                  <th className="py-2 pr-4 font-medium">Tanggal</th>
                  <th className="py-2 pr-4 font-medium">Practitioner</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Check-in</th>
                  <th className="py-2 pr-4 font-medium">Check-out</th>
                  <th className="py-2 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr className="border-b last:border-0" key={record.id}>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-foreground-muted">
                      {record.workDate}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {record.practitionerName}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={statusTone[record.status]}>
                        {statusLabel[record.status]}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-foreground-muted">
                      {record.checkIn ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-foreground-muted">
                      {record.checkOut ?? "—"}
                    </td>
                    <td className="py-2.5 text-foreground-muted">
                      {record.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </>
  );
}
