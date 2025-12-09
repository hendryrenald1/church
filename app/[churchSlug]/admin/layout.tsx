"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
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
  const fallbackName = useMemo(
    () => params.churchSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    [params.churchSlug]
  );
  const [churchName, setChurchName] = useState<string>(fallbackName);

  useEffect(() => {
    let active = true;
    const fetchChurch = async () => {
      try {
        const res = await fetch("/api/admin/church");
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.name) setChurchName(data.name);
      } catch (error) {
        console.error("Failed to load church info", error);
      }
    };
    fetchChurch();
    return () => {
      active = false;
    };
  }, [churchSlug, fallbackName]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <AdminSidebar
          churchSlug={churchSlug}
          churchName={churchName}
          currentPath={pathname}
          className="hidden md:flex"
        />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="sticky top-0 z-30 border-b bg-background/90 px-4 py-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Managing</p>
            <p className="text-2xl font-semibold">{churchName}</p>
          </div>
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        </main>
      </div>
      <AdminBottomNav churchSlug={churchSlug} currentPath={pathname} className="md:hidden" />
    </div>
  );
}
