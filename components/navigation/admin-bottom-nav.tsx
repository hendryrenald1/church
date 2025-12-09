"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Home,
  Building2,
  MoreHorizontal,
  UserCog,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogoutButton } from "@/components/navigation/logout-button";

type Props = {
  churchSlug: string;
  currentPath: string;
  className?: string;
};

export function AdminBottomNav({ churchSlug, currentPath, className }: Props) {
  const [open, setOpen] = useState(false);
  const tabs = [
    { label: "Home", href: `/${churchSlug}/admin/dashboard`, icon: LayoutDashboard },
    { label: "Members", href: `/${churchSlug}/admin/members`, icon: Users },
    { label: "Families", href: `/${churchSlug}/admin/families`, icon: Home },
    { label: "Branches", href: `/${churchSlug}/admin/branches`, icon: Building2 }
  ];

  return (
    <div className={cn("md:hidden", className)}>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t bg-card px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentPath.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground",
                active && "text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-10">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              <Link
                href={`/${churchSlug}/admin/pastors`}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                <UserCog className="h-4 w-4" />
                Pastors
              </Link>
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Reports (coming soon)
              </div>
              <Link
                href={`/${churchSlug}/admin/settings/church`}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Church settings
              </Link>
              <LogoutButton variant="outline" className="w-full justify-center" />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
      <div className="h-16" />
    </div>
  );
}
