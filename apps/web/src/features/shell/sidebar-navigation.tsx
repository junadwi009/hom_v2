"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { operationalNavigation } from "@/lib/routes";
import { cn } from "@/lib/utils";

type NavLink = { label: string; href: string; icon?: LucideIcon };
type NavChild = { label: string; href: string };
type NavSubGroup = { label: string; children: NavChild[] };
type NavGroupChild = NavChild | NavSubGroup;
type NavGroup = { label: string; icon: LucideIcon; children: NavGroupChild[] };
type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

function isSubGroup(child: NavGroupChild): child is NavSubGroup {
  return "children" in child;
}

function childHrefs(child: NavGroupChild): string[] {
  return isSubGroup(child) ? child.children.map((link) => link.href) : [child.href];
}

function groupFirstHref(group: NavGroup): string {
  const first = group.children[0];
  return isSubGroup(first) ? first.children[0].href : first.href;
}

function isHrefActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/clients") return pathname === "/clients";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = (active: boolean, collapsed: boolean) =>
  cn(
    "flex min-h-10 items-center rounded-md text-sm font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white",
    collapsed ? "justify-center px-0" : "gap-3 px-3",
    active &&
      "bg-[var(--accent-gold)] text-stone-950 hover:bg-[var(--accent-gold)] hover:text-stone-950",
  );

const childLinkClass = (active: boolean) =>
  cn(
    "flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white",
    active &&
      "bg-[var(--accent-gold)] text-stone-950 hover:bg-[var(--accent-gold)] hover:text-stone-950",
  );

export function SidebarNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {(operationalNavigation as NavEntry[]).map((entry) =>
        isGroup(entry) ? (
          <NavGroupItem
            collapsed={collapsed}
            group={entry}
            key={entry.label}
            pathname={pathname}
          />
        ) : (
          <NavLinkItem
            collapsed={collapsed}
            item={entry}
            key={entry.href}
            pathname={pathname}
          />
        ),
      )}
    </nav>
  );
}

function NavLinkItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavLink;
  pathname: string;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const active = isHrefActive(pathname, item.href);

  return (
    <Link
      aria-label={collapsed ? item.label : undefined}
      className={linkClass(active, collapsed)}
      href={item.href}
      title={collapsed ? item.label : undefined}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      {collapsed ? null : <span>{item.label}</span>}
    </Link>
  );
}

function NavGroupItem({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  const Icon = group.icon;
  const allHrefs = group.children.flatMap(childHrefs);
  const groupActive = allHrefs.some((href) => isHrefActive(pathname, href));
  const [open, setOpen] = useState(groupActive);

  if (collapsed) {
    return (
      <div className="group/nav relative">
        <Link
          aria-label={group.label}
          className={linkClass(groupActive, true)}
          href={groupFirstHref(group)}
          title={group.label}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
        </Link>
        <div className="absolute left-full top-0 z-40 ml-2 hidden min-w-52 rounded-md border border-white/10 bg-[var(--background-sidebar)] p-1.5 shadow-2xl group-hover/nav:block">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-normal text-[var(--sidebar-muted)]">
            {group.label}
          </p>
          {group.children.map((child) =>
            isSubGroup(child) ? (
              <div className="mt-1" key={child.label}>
                <p className="px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-normal text-[var(--sidebar-muted)] opacity-70">
                  {child.label}
                </p>
                {child.children.map((link) => (
                  <FlyoutLink
                    active={isHrefActive(pathname, link.href)}
                    key={link.href}
                    link={link}
                  />
                ))}
              </div>
            ) : (
              <FlyoutLink
                active={isHrefActive(pathname, child.href)}
                key={child.href}
                link={child}
              />
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        aria-expanded={open}
        className={cn(linkClass(false, false), "w-full justify-between")}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="flex items-center gap-3">
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {group.label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="mt-1 space-y-1 pl-4">
          {group.children.map((child) =>
            isSubGroup(child) ? (
              <NavSubGroupItem
                key={child.label}
                pathname={pathname}
                subGroup={child}
              />
            ) : (
              <Link
                className={childLinkClass(isHrefActive(pathname, child.href))}
                href={child.href}
                key={child.href}
              >
                {child.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function NavSubGroupItem({
  subGroup,
  pathname,
}: {
  subGroup: NavSubGroup;
  pathname: string;
}) {
  const subActive = subGroup.children.some((link) =>
    isHrefActive(pathname, link.href),
  );
  const [open, setOpen] = useState(subActive);

  return (
    <div>
      <button
        aria-expanded={open}
        className={cn(
          "flex min-h-9 w-full items-center justify-between rounded-md px-3 text-sm font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white",
          subActive && !open && "text-white",
        )}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>{subGroup.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="mt-1 space-y-1 border-l border-white/10 pl-3">
          {subGroup.children.map((link) => (
            <Link
              className={childLinkClass(isHrefActive(pathname, link.href))}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FlyoutLink({ link, active }: { link: NavChild; active: boolean }) {
  return (
    <Link
      className={cn(
        "block rounded-md px-2 py-1.5 text-sm font-medium text-[var(--sidebar-muted)] transition-colors hover:bg-white/10 hover:text-white",
        active &&
          "bg-[var(--accent-gold)] text-stone-950 hover:bg-[var(--accent-gold)] hover:text-stone-950",
      )}
      href={link.href}
    >
      {link.label}
    </Link>
  );
}
