"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { AdminBottomNav } from "@/components/navigation/admin-bottom-nav";

export default function AdminLayout({
  params,
  children
}: {
  params: { churchSlug: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const churchSlug = params.churchSlug;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <AdminSidebar churchSlug={churchSlug} currentPath={pathname} className="hidden md:flex" />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        </main>
      </div>
      <AdminBottomNav churchSlug={churchSlug} currentPath={pathname} className="md:hidden" />
    </div>
  );
}
