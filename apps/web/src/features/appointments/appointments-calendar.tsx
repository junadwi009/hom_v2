"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

type MonthView = { year: number; month: number };
type DayParts = { year: number; month: number; day: number };
type DayCell = DayParts & { inMonth: boolean };

export function AppointmentsCalendar({
  events,
}: {
  events: AppointmentTableRow[];
}) {
  const [view, setView] = useState<MonthView>(() =>
    computeInitialMonth(events),
  );

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentTableRow[]>();
    for (const event of events) {
      const parts = jakartaParts(event.startsAt);
      if (!parts) continue;
      const key = dayKey(parts);
      const existing = map.get(key);
      if (existing) {
        existing.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }, [events]);

  const cells = useMemo(() => buildMonthCells(view.year, view.month), [view]);

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
                "min-h-[100px] bg-background-card p-1.5",
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
                  <div
                    className={cn(
                      "truncate rounded border px-1.5 py-0.5 text-[11px] leading-4",
                      STATUS_STYLES[event.status] ??
                        "border-stone-200 bg-stone-100 text-stone-800",
                    )}
                    key={event.id}
                    title={`${jakartaTime(event.startsAt)} · ${event.clientName} · ${event.status}`}
                  >
                    <span className="font-semibold">
                      {jakartaTime(event.startsAt)}
                    </span>{" "}
                    {event.clientName}
                  </div>
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
      </div>
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
