"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

import { AppointmentsCalendar } from "./appointments-calendar";
import type { AppointmentTableRow } from "./appointments-page-state";

type AppointmentsViewMode = "calendar" | "list";

const STORAGE_KEY = "hom-appointments-view";

let listeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
  };
}

function getSnapshot(): AppointmentsViewMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "calendar"
      ? "calendar"
      : "list";
  } catch {
    return "list";
  }
}

function getServerSnapshot(): AppointmentsViewMode {
  return "list";
}

function setMode(next: AppointmentsViewMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore persistence failures.
  }
  listeners.forEach((listener) => listener());
}

export function AppointmentsScheduleView({
  events,
  listSlot,
}: {
  events: AppointmentTableRow[];
  listSlot: ReactNode;
}) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <>
      <div
        aria-label="Tampilan jadwal"
        className="inline-flex w-fit rounded-lg border bg-background-card p-1"
        role="tablist"
      >
        <ModeButton
          active={mode === "calendar"}
          onClick={() => setMode("calendar")}
        >
          Kalender
        </ModeButton>
        <ModeButton active={mode === "list"} onClick={() => setMode("list")}>
          Daftar
        </ModeButton>
      </div>
      {mode === "calendar" ? (
        <>
          <PageHeader
            eyebrow="Schedule"
            title="Appointments"
            description="Jadwal janji temu dalam tampilan kalender bulanan."
          />
          <AppointmentsCalendar events={events} />
        </>
      ) : (
        listSlot
      )}
    </>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground-muted hover:bg-accent-gold-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
