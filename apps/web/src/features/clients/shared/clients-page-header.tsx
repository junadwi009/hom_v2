import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function ClientsPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{subtitle}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function HeaderSelect({
  icon,
  options,
  ariaLabel,
}: {
  icon?: ReactNode;
  options: string[];
  ariaLabel: string;
}) {
  return (
    <span className="relative inline-flex items-center gap-2 rounded-md border bg-background-card pl-3 pr-8 shadow-sm">
      {icon}
      <select
        aria-label={ariaLabel}
        className="h-9 appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 size-4 text-foreground-muted"
      />
    </span>
  );
}
