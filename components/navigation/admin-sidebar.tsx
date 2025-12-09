"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Home, Building2, UserCog, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/navigation/logout-button";

const getNavItems = (slug: string) => [
  { label: "Dashboard", href: `/${slug}/admin/dashboard`, icon: LayoutDashboard },
  { label: "Members", href: `/${slug}/admin/members`, icon: Users },
  { label: "Families", href: `/${slug}/admin/families`, icon: Home },
  { label: "Branches", href: `/${slug}/admin/branches`, icon: Building2 },
  { label: "Pastors", href: `/${slug}/admin/pastors`, icon: UserCog }
];

const getSecondaryItems = (slug: string) => [
  { label: "Church Settings", href: `/${slug}/admin/settings/church`, icon: Settings }
];

type Props = {
  churchSlug: string;
  currentPath: string;
  className?: string;
};

export function AdminSidebar({ churchSlug, currentPath, className }: Props) {
  const primary = getNavItems(churchSlug);
  const secondary = getSecondaryItems(churchSlug);

  return (
    <aside className={cn("hidden w-64 flex-col border-r bg-card md:flex", className)}>
      <div className="flex h-16 items-center px-6 text-lg font-semibold">Admin</div>
      <nav className="flex-1 space-y-1 px-3">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted",
                active && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t px-3 py-4">
        {secondary.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted",
                active && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <LogoutButton fullWidth />
      </div>
    </aside>
  );
}
