"use client";

import { CalendarClock, ChevronLeft, ChevronRight, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  initialCancelAppointmentActionState,
  type CancelAppointmentFormAction,
} from "./cancel-appointment-types";
import {
  initialCompleteAppointmentActionState,
  type CompleteAppointmentFormAction,
} from "./complete-appointment-types";
import {
  initialMarkNoShowAppointmentActionState,
  type MarkNoShowAppointmentFormAction,
} from "./mark-no-show-appointment-types";
import {
  initialRescheduleAppointmentActionState,
  type RescheduleAppointmentFormAction,
} from "./reschedule-appointment-types";
import type { AppointmentTableRow } from "./appointments-page-state";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const STATUS_STYLES: Record<string, string> = {
  scheduled: "border-blue-200 bg-blue-100 text-blue-900",
  confirmed: "border-blue-200 bg-blue-100 text-blue-900",
  completed: "border-green-200 bg-green-100 text-green-900",
  cancelled: "border-red-200 bg-red-100 text-red-900",
  no_show: "border-amber-200 bg-amber-100 text-amber-900",
};

const STATUS_BADGE: Record<
  string,
  "info" | "success" | "danger" | "warning" | "neutral"
> = {
  scheduled: "info",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "warning",
};

type MonthView = { year: number; month: number };
type DayParts = { year: number; month: number; day: number };
type DayCell = DayParts & { inMonth: boolean };

export type CalendarActions = {
  reschedule: RescheduleAppointmentFormAction;
  complete: CompleteAppointmentFormAction;
  cancel: CancelAppointmentFormAction;
  markNoShow: MarkNoShowAppointmentFormAction;
};

const TERMINAL = new Set(["completed", "cancelled", "no_show"]);

export function AppointmentsCalendar({
  events,
  actions,
  canManage = false,
}: {
  events: AppointmentTableRow[];
  actions?: CalendarActions;
  canManage?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<MonthView>(() => computeInitialMonth(events));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentTableRow[]>();
    for (const event of events) {
      const parts = jakartaParts(event.startsAt);
      if (!parts) continue;
      const key = dayKey(parts);
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => buildMonthCells(view.year, view.month), [view]);
  const editing = events.find((item) => item.id === editingId) ?? null;

  const goMonth = (delta: number) =>
    setView((current) => {
      const absolute = current.month + delta;
      return {
        year: current.year + Math.floor(absolute / 12),
        month: ((absolute % 12) + 12) % 12,
      };
    });

  const goToday = () => {
    const now = new Date();
    setView({ year: now.getUTCFullYear(), month: now.getUTCMonth() });
  };

  const openEdit = (event: AppointmentTableRow) => {
    setEditingId(event.id);
    setTime(toJakartaInput(event.startsAt));
    setReason("");
    setError(null);
  };

  const closeEdit = () => {
    if (pending) return;
    setEditingId(null);
    setError(null);
  };

  async function run(result: Promise<{ status: string; message?: string }>) {
    setPending(true);
    setError(null);
    try {
      const state = await result;
      if (state.status === "success") {
        setEditingId(null);
        router.refresh();
      } else {
        setError(state.message ?? "Aksi gagal diproses.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  function handleReschedule() {
    if (!actions || !editing) return;
    if (reason.trim() === "") {
      setError("Isi alasan perubahan jadwal terlebih dahulu.");
      return;
    }
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("startsAtLocal", time);
    fd.set("reason", reason.trim());
    void run(actions.reschedule(initialRescheduleAppointmentActionState, fd));
  }

  function handleComplete() {
    if (!actions || !editing) return;
    const fd = new FormData();
    fd.set("id", editing.id);
    void run(actions.complete(initialCompleteAppointmentActionState, fd));
  }

  function handleCancel() {
    if (!actions || !editing) return;
    if (reason.trim() === "") {
      setError("Isi alasan pembatalan terlebih dahulu.");
      return;
    }
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("reason", reason.trim());
    void run(actions.cancel(initialCancelAppointmentActionState, fd));
  }

  function handleNoShow() {
    if (!actions || !editing) return;
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("reason", reason.trim());
    void run(actions.markNoShow(initialMarkNoShowAppointmentActionState, fd));
  }

  return (
    <div className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {MONTHS_ID[view.month]} {view.year}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Bulan sebelumnya"
            onClick={() => goMonth(-1)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button onClick={goToday} size="sm" type="button" variant="secondary">
            Hari ini
          </Button>
          <Button
            aria-label="Bulan berikutnya"
            onClick={() => goMonth(1)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-t-md border border-b-0 bg-border-subtle text-center text-[11px] font-semibold uppercase text-foreground-muted">
        {WEEKDAYS.map((weekday) => (
          <div className="bg-stone-50 py-2" key={weekday}>
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px rounded-b-md border bg-border-subtle">
        {cells.map((cell) => {
          const dayEvents = byDay.get(dayKey(cell)) ?? [];
          return (
            <div
              className={cn(
                "min-h-[104px] bg-background-card p-1.5",
                !cell.inMonth && "bg-stone-50/60",
              )}
              key={`${cell.year}-${cell.month}-${cell.day}-${cell.inMonth ? 1 : 0}`}
            >
              <div
                className={cn(
                  "mb-1 text-right text-xs",
                  cell.inMonth ? "text-foreground" : "text-foreground-muted",
                )}
              >
                {cell.day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventChip event={event} key={event.id} onOpen={openEdit} />
                ))}
                {dayEvents.length > 3 ? (
                  <div className="px-1 text-[11px] text-foreground-muted">
                    +{dayEvents.length - 3} lagi
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground-muted">
        <LegendDot className="bg-blue-200" label="Terjadwal" />
        <LegendDot className="bg-green-200" label="Selesai" />
        <LegendDot className="bg-red-200" label="Dibatalkan" />
        <LegendDot className="bg-amber-200" label="No-show" />
        <span className="ml-auto">Hover untuk info · klik untuk kelola</span>
      </div>

      {editing ? (
        <EditDialog
          appointment={editing}
          canManage={canManage}
          error={error}
          onCancel={handleCancel}
          onClose={closeEdit}
          onComplete={handleComplete}
          onNoShow={handleNoShow}
          onReason={setReason}
          onReschedule={handleReschedule}
          onTime={setTime}
          pending={pending}
          reason={reason}
          time={time}
        />
      ) : null}
    </div>
  );
}

function EventChip({
  event,
  onOpen,
}: {
  event: AppointmentTableRow;
  onOpen: (event: AppointmentTableRow) => void;
}) {
  return (
    <div className="group/event relative">
      <button
        className={cn(
          "block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] leading-4",
          STATUS_STYLES[event.status] ??
            "border-stone-200 bg-stone-100 text-stone-800",
        )}
        onClick={() => onOpen(event)}
        type="button"
      >
        <span className="font-semibold">{jakartaTime(event.startsAt)}</span>{" "}
        {event.clientName}
      </button>

      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-60 rounded-lg border bg-background-card p-3 text-left shadow-xl group-hover/event:block">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{event.serviceName}</p>
          <Badge tone={STATUS_BADGE[event.status] ?? "neutral"}>
            {event.status.replaceAll("_", " ")}
          </Badge>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
          <CalendarClock aria-hidden="true" className="size-3.5" />
          {jakartaDateTime(event.startsAt)} · {event.duration}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
          <User aria-hidden="true" className="size-3.5" />
          {event.clientName}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          Instruktur: {event.practitionerName}
        </p>
        <p className="mt-2 text-[11px] font-medium text-amber-800">
          Klik untuk kelola →
        </p>
      </div>
    </div>
  );
}

function EditDialog({
  appointment,
  canManage,
  time,
  reason,
  pending,
  error,
  onTime,
  onReason,
  onReschedule,
  onComplete,
  onCancel,
  onNoShow,
  onClose,
}: {
  appointment: AppointmentTableRow;
  canManage: boolean;
  time: string;
  reason: string;
  pending: boolean;
  error: string | null;
  onTime: (value: string) => void;
  onReason: (value: string) => void;
  onReschedule: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
  onClose: () => void;
}) {
  const fieldClass =
    "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted disabled:opacity-60";
  const terminal = TERMINAL.has(appointment.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Tutup"
        className="absolute inset-0 bg-stone-950/35"
        onClick={onClose}
        type="button"
      />
      <section
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-lg border bg-background-card p-5 shadow-2xl"
        role="dialog"
      >
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Kelola Appointment
            </h3>
            <p className="text-xs text-foreground-muted">
              {appointment.clientName} · {appointment.serviceName}
            </p>
          </div>
          <Button aria-label="Tutup" onClick={onClose} size="icon" type="button" variant="ghost">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </header>

        <dl className="mb-4 space-y-1 rounded-md border p-3 text-xs text-foreground-muted">
          <Row label="Instruktur" value={appointment.practitionerName} />
          <Row label="Durasi" value={appointment.duration} />
          <Row
            label="Status"
            value={appointment.status.replaceAll("_", " ")}
          />
        </dl>

        {canManage ? (
          <>
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground-muted">
                  Jadwalkan ulang (waktu mulai)
                </span>
                <input
                  className={fieldClass}
                  disabled={pending || terminal}
                  onChange={(event) => onTime(event.target.value)}
                  type="datetime-local"
                  value={time}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground-muted">
                  Alasan (untuk reschedule / batal)
                </span>
                <input
                  className={fieldClass}
                  disabled={pending}
                  onChange={(event) => onReason(event.target.value)}
                  placeholder="mis. Diminta klien"
                  value={reason}
                />
              </label>
            </div>

            {error ? (
              <p
                className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                disabled={pending || terminal}
                onClick={onReschedule}
                size="sm"
                type="button"
              >
                {pending ? "Memproses..." : "Simpan Jadwal"}
              </Button>
              <Button
                disabled={pending || terminal}
                onClick={onComplete}
                size="sm"
                type="button"
                variant="secondary"
              >
                Tandai Selesai
              </Button>
              <Button
                disabled={pending || terminal}
                onClick={onNoShow}
                size="sm"
                type="button"
                variant="secondary"
              >
                No-show
              </Button>
              <Button
                disabled={pending || terminal}
                onClick={onCancel}
                size="sm"
                type="button"
                variant="secondary"
              >
                Batalkan
              </Button>
            </div>
            {terminal ? (
              <p className="mt-2 text-[11px] text-foreground-muted">
                Appointment sudah berstatus final dan tidak bisa diubah.
              </p>
            ) : null}
          </>
        ) : (
          <p className="rounded-md border bg-stone-50 px-3 py-2 text-xs text-foreground-muted">
            Anda tidak memiliki izin untuk mengubah appointment.
          </p>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-medium capitalize text-foreground">{value}</dd>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block size-3 rounded-sm", className)} />
      {label}
    </span>
  );
}

function computeInitialMonth(events: AppointmentTableRow[]): MonthView {
  const firstWithDate = events
    .map((event) => jakartaParts(event.startsAt))
    .find((parts): parts is DayParts => parts !== null);
  if (firstWithDate) {
    return { year: firstWithDate.year, month: firstWithDate.month };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

function dayKey(parts: DayParts): string {
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function buildMonthCells(year: number, month: number): DayCell[] {
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: DayCell[] = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const day = prevMonthDays - index;
    const date = new Date(Date.UTC(year, month - 1, day));
    cells.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ year, month, day, inMonth: true });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const date = new Date(Date.UTC(year, month + 1, nextDay));
    cells.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

function jakartaParts(iso: string): DayParts | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(time);
  const pick = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

function jakartaTime(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(time);
}

function jakartaDateTime(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(time);
}

// Build a datetime-local value (YYYY-MM-DDTHH:mm) in Asia/Jakarta so it round-trips
// through the reschedule RPC's Jakarta-local interpretation.
function toJakartaInput(iso: string): string {
  const parts = jakartaParts(iso);
  const hm = jakartaTime(iso);
  if (!parts || !hm) return "";
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${parts.year}-${mm}-${dd}T${hm}`;
}
