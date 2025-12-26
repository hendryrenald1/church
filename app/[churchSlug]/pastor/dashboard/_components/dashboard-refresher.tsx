"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";

interface DashboardRefresherProps {
  /** Refresh interval in seconds. Default is 30 seconds */
  intervalSeconds?: number;
  /** Whether to show a visual indicator when refreshing */
  showIndicator?: boolean;
}

export function DashboardRefresher({
  intervalSeconds = 30,
  showIndicator = false
}: DashboardRefresherProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setLastRefresh(new Date());
    // Reset the refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 500);
  }, [router]);

  useEffect(() => {
    // Set up interval for periodic refresh
    const interval = setInterval(refresh, intervalSeconds * 1000);

    // Also refresh when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if it's been more than half the interval since last refresh
        const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
        if (timeSinceLastRefresh > (intervalSeconds * 1000) / 2) {
          refresh();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalSeconds, refresh, lastRefresh]);

  // Optionally show a subtle indicator when refreshing
  if (showIndicator && isRefreshing) {
    return (
      <div className="fixed top-2 right-2 z-50">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      </div>
    );
  }

  return null;
}
