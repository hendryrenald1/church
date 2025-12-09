import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Church Platform",
  description: "Multi-tenant church management built with Next.js and Supabase"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background text-foreground antialiased")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
