import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AttendanceRecordView = {
  id: string;
  practitionerName: string;
  workDate: string;
  status: "present" | "absent" | "late" | "leave";
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
};

export type PractitionerOption = {
  id: string;
  name: string;
};

export type TeamAttendanceData = {
  records: AttendanceRecordView[];
  practitioners: PractitionerOption[];
};

type AttendanceRow = {
  id: string;
  practitioner_id: string;
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  note: string | null;
};

type PractitionerRow = {
  id: string;
  display_name: string;
};

const statusValues: AttendanceRecordView["status"][] = [
  "present",
  "absent",
  "late",
  "leave",
];

// Loads attendance records joined with practitioner names (for the table) plus
// the practitioner option list (for the create form select). Returns empty
// collections on failure so the page can render gracefully.
export async function loadTeamAttendanceData(): Promise<TeamAttendanceData> {
  try {
    const supabase = await createSupabaseServerClient();

    const [recordsResult, practitionersResult] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("id, practitioner_id, work_date, status, check_in, check_out, note")
        .order("work_date", { ascending: false })
        .limit(50),
      supabase
        .from("practitioners")
        .select("id, display_name")
        .eq("status", "active")
        .order("display_name", { ascending: true })
        .limit(200),
    ]);

    const practitionerRows = (practitionersResult.data as PractitionerRow[]) ?? [];
    const nameById = new Map(
      practitionerRows.map((row) => [row.id, row.display_name]),
    );

    const records = ((recordsResult.data as AttendanceRow[]) ?? []).map(
      (row) => ({
        id: row.id,
        practitionerName: nameById.get(row.practitioner_id) ?? "—",
        workDate: row.work_date,
        status: statusValues.includes(row.status as AttendanceRecordView["status"])
          ? (row.status as AttendanceRecordView["status"])
          : "present",
        checkIn: row.check_in,
        checkOut: row.check_out,
        note: row.note,
      }),
    );

    return {
      records,
      practitioners: practitionerRows.map((row) => ({
        id: row.id,
        name: row.display_name,
      })),
    };
  } catch {
    return { records: [], practitioners: [] };
  }
}
