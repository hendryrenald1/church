"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/superadmin/dashboard", label: "Dashboard" },
  { href: "/superadmin/churches", label: "Churches" },
  { href: "/superadmin/churches/new", label: "Create Church" }
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
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
          <div className="text-lg font-semibold">Super Admin</div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <nav className="flex gap-4">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={cn("hover:text-foreground")}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-primary hover:underline disabled:opacity-60"
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
