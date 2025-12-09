"use client";

import Link from "next/link";
import { LayoutDashboard, Users, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/navigation/logout-button";

const getNavItems = (slug: string) => [
  { label: "Dashboard", href: `/${slug}/pastor/dashboard`, icon: LayoutDashboard },
  { label: "Members", href: `/${slug}/pastor/members`, icon: Users },
  { label: "Add Member", href: `/${slug}/pastor/members/new`, icon: PlusCircle },
  { label: "My Profile", href: `/${slug}/pastor/profile`, icon: User }
];

type Props = {
  churchSlug: string;
  currentPath: string;
  className?: string;
};

export function PastorSidebar({ churchSlug, currentPath, className }: Props) {
  const items = getNavItems(churchSlug);
  return (
    <aside className={cn("hidden w-64 flex-col border-r bg-card md:flex", className)}>
      <div className="flex h-16 items-center px-6 text-lg font-semibold">Pastor</div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
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
      <div className="border-t px-3 py-4">
        <LogoutButton fullWidth />
      </div>
    </aside>
  );
}
