"use client";

import Link from "next/link";
import { LayoutDashboard, Building2, PlusCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/navigation/logout-button";

const mainNav = [
  { label: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { label: "Churches", href: "/superadmin/churches", icon: Building2 },
  { label: "New Church", href: "/superadmin/churches/new", icon: PlusCircle }
];

const secondaryNav = [{ label: "Settings", href: "/superadmin/settings", icon: Settings }];

type Props = {
  currentPath: string;
  className?: string;
};

export function SuperAdminSidebar({ currentPath, className }: Props) {
  return (
    <aside className={cn("hidden w-64 flex-col border-r bg-card md:flex", className)}>
      <div className="flex h-16 items-center px-6 text-lg font-semibold">Super Admin</div>
      <nav className="flex-1 space-y-1 px-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted",
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
        {secondaryNav.map((item) => {
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
