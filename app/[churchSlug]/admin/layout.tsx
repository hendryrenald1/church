"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const nav = [
  { href: "dashboard", label: "Dashboard" },
  { href: "branches", label: "Branches" },
  { href: "members", label: "Members" },
  { href: "families", label: "Families" },
  { href: "pastors", label: "Pastors" },
  { href: "settings/church", label: "Settings" }
];

export default function AdminLayout({
  params,
  children
}: {
  params: { churchSlug: string };
  children: ReactNode;
}) {
  const base = `/${params.churchSlug}/admin/`;
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Failed to logout", error);
      setLoggingOut(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Admin · {params.churchSlug}</div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <nav className="flex gap-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={`${base}${item.href}`}
                  className={cn("hover:text-foreground")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="text-primary hover:underline disabled:opacity-60"
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
