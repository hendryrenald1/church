"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SuperAdminSidebar } from "@/components/navigation/superadmin-sidebar";
import { SuperAdminBottomNav } from "@/components/navigation/superadmin-bottom-nav";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <SuperAdminSidebar currentPath={pathname} className="hidden md:flex" />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        </main>
      </div>
      <SuperAdminBottomNav currentPath={pathname} className="md:hidden" />
    </div>
  );
}
