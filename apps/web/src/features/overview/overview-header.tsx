"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import {
  branchOptions,
  periodOptions,
  type BranchId,
  type PeriodId,
} from "./overview-data";

type OverviewHeaderProps = {
  period: PeriodId;
  branch: BranchId;
  onPeriodChange: (period: PeriodId) => void;
  onBranchChange: (branch: BranchId) => void;
};

export function OverviewHeader({
  period,
  branch,
  onPeriodChange,
  onBranchChange,
}: OverviewHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Dashboard — Fokus Keputusan
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Ringkasan bisnis hari ini untuk membantu Anda mengambil keputusan terbaik.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          ariaLabel="Pilih periode"
          icon={<CalendarDays aria-hidden="true" className="size-4 text-foreground-muted" />}
          onChange={(value) => onPeriodChange(value as PeriodId)}
          value={period}
        >
          {periodOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          ariaLabel="Pilih cabang"
          onChange={(value) => onBranchChange(value as BranchId)}
          value={branch}
        >
          {branchOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </div>
    </header>
  );
}

function FilterSelect({
  ariaLabel,
  icon,
  value,
  onChange,
  children,
}: {
  ariaLabel: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center rounded-md border bg-background-card pl-3 pr-9 shadow-sm focus-within:border-accent-gold focus-within:ring-2 focus-within:ring-accent-gold-muted">
      {icon}
      <select
        aria-label={ariaLabel}
        className="appearance-none bg-transparent py-2 pl-2 text-sm font-medium text-foreground outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 size-4 text-foreground-muted"
      />
    </span>
  );
}
