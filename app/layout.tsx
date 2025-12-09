import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Church Platform",
  description: "Multi-tenant church management built with Next.js and Supabase"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background text-foreground antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <ThemeToggle className="fixed right-4 top-4 z-50" />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
