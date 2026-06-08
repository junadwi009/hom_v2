"use client";

import type { AdminUser } from "@hom/domain/users";
import { KeyRound, MoreHorizontal, ShieldOff, UserRound } from "lucide-react";

import { StatusBadge } from "@/components/hom/status-badge";
import { Badge } from "@/components/ui/badge";
import { DemoButton, DemoLink } from "@/features/shell/demo-action";
import { ClientTabs } from "@/features/clients/shared/clients-tabs";

import { formatRoleName } from "./role-options";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export function UserDetailPanel({ user }: { user: AdminUser | null }) {
  if (!user) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-lg border bg-background-card p-8 text-center shadow-[var(--shadow-soft)]">
        <UserRound aria-hidden="true" className="size-8 text-foreground-muted" />
        <p className="mt-3 text-sm font-medium text-foreground">Pilih user</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Klik salah satu baris untuk melihat detail pengguna.
        </p>
      </section>
    );
  }

  const primaryRole = user.roles[0] ? formatRoleName(user.roles[0]) : "—";

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-sm font-semibold text-amber-900">
          {initials(user.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-base font-semibold text-foreground">
            {user.fullName}
            <Badge tone="info">{primaryRole}</Badge>
          </p>
          <p className="truncate text-xs text-foreground-muted">{user.email}</p>
          <div className="mt-1.5">
            <StatusBadge status={user.status} />
          </div>
        </div>
      </header>

      <ClientTabs
        tabs={["Overview", "Access & Permissions", "Activity Log", "Notes"]}
      />

      <div>
        <p className="text-sm font-semibold text-foreground">Informasi Pengguna</p>
        <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
          <Row label="Nama Lengkap" value={user.fullName} />
          <Row label="Email" value={user.email} />
          <RoleRow roles={user.roles} />
          <Row label="Status" value={user.status} />
          <Row label="Dibuat Pada" value="—" />
          <Row label="Last Login" value="—" />
          <Row label="Password Terakhir Diubah" value="—" />
        </dl>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Akses Cabang</p>
        <p className="mt-2 text-xs text-foreground-muted">
          Akses per-cabang belum dimodelkan untuk user.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Aksi Cepat</p>
        <div className="flex gap-2">
          <DemoButton
            className="flex-1"
            message={`Reset password ${user.fullName} (demo).`}
            size="sm"
            type="button"
            variant="secondary"
          >
            <KeyRound aria-hidden="true" className="size-4" />
            Reset Password
          </DemoButton>
          <DemoButton
            className="flex-1"
            message={`Nonaktifkan ${user.fullName} (demo). Gunakan tombol Status di tabel untuk aksi nyata.`}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ShieldOff aria-hidden="true" className="size-4" />
            Nonaktifkan
          </DemoButton>
        </div>
        <DemoLink
          className="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground-muted hover:bg-stone-100 hover:text-foreground"
          message={`Membuka aktivitas ${user.fullName} (demo).`}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
          Lihat Semua Aktivitas
        </DemoLink>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0">{label}</dt>
      <dd className="break-all text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function RoleRow({ roles }: { roles: string[] }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0">Role</dt>
      <dd className="flex flex-wrap justify-end gap-1">
        {roles.length === 0 ? (
          <span className="font-medium text-foreground">—</span>
        ) : (
          roles.map((role) => (
            <Badge key={role} tone="info">
              {formatRoleName(role)}
            </Badge>
          ))
        )}
      </dd>
    </div>
  );
}
