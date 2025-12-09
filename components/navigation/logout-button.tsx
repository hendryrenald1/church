"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  fullWidth?: boolean;
};

export function LogoutButton({ className, variant = "ghost", fullWidth }: Props) {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Failed to logout", error);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={logout}
      disabled={loading}
      className={cn(fullWidth && "w-full justify-start", className)}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
