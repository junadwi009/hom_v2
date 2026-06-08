"use client";

import type { AdminUser } from "@hom/domain/users";

import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/hom/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatRoleName } from "./role-options";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

type UsersTableProps = {
  users: AdminUser[];
  currentUserId?: string | null;
  canManage?: boolean;
  selectedId?: string | null;
  onSelect?: (user: AdminUser) => void;
  onEditRoles: (user: AdminUser) => void;
  onChangeStatus: (user: AdminUser) => void;
};

export function UsersTable({
  users,
  currentUserId,
  canManage = false,
  selectedId,
  onSelect,
  onEditRoles,
  onChangeStatus,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Belum ada user"
        description="Tambahkan user pertama dengan tombol Tambah User."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Nama
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Email
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Role
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th className="border-b px-4 py-3 text-right font-semibold" scope="col">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = currentUserId === user.id;
              return (
                <tr
                  className={cn(
                    "border-b last:border-b-0 hover:bg-stone-50/70",
                    onSelect && "cursor-pointer",
                    selectedId === user.id && "bg-accent-gold-muted/40",
                  )}
                  key={user.id}
                  onClick={onSelect ? () => onSelect(user) : undefined}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-xs font-semibold text-amber-900">
                        {initials(user.fullName)}
                      </span>
                      <span>
                        {user.fullName}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-foreground-muted">
                            (Anda)
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-foreground-muted">—</span>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role} tone="info">
                            {formatRoleName(role)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className={cn("px-4 py-3 text-right")}>
                    <div className="flex justify-end gap-2">
                      <Button
                        disabled={!canManage || isSelf}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditRoles(user);
                        }}
                        size="sm"
                        title={isSelf ? "Tidak bisa mengubah akun sendiri." : undefined}
                        type="button"
                        variant="secondary"
                      >
                        Role
                      </Button>
                      <Button
                        disabled={!canManage || isSelf}
                        onClick={(event) => {
                          event.stopPropagation();
                          onChangeStatus(user);
                        }}
                        size="sm"
                        title={isSelf ? "Tidak bisa mengubah akun sendiri." : undefined}
                        type="button"
                        variant="secondary"
                      >
                        Status
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
