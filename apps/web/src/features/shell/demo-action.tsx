"use client";

import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

import { useToast } from "./toast";

// Wraps the design-system Button and fires a toast on click. Used for actions
// that are presentational in mock pages (no backend yet) so no button is dead.
export function DemoButton({
  message,
  children,
  onClick,
  ...props
}: ButtonProps & { message: string }) {
  const notify = useToast();
  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        notify(message);
      }}
    >
      {children}
    </Button>
  );
}

// Icon-only row action button (stops row click propagation).
export function DemoIconButton({
  message,
  label,
  className,
  children,
}: {
  message: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const notify = useToast();
  return (
    <button
      aria-label={label}
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        notify(message);
      }}
      type="button"
    >
      {children}
    </button>
  );
}

// Text/link-styled action (e.g. "Lihat semua →").
export function DemoLink({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  const notify = useToast();
  return (
    <button className={className} onClick={() => notify(message)} type="button">
      {children}
    </button>
  );
}
