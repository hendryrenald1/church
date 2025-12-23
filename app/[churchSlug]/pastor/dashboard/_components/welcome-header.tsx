"use client";

import { format } from "date-fns";

interface WelcomeHeaderProps {
  pastorName: string;
}

export function WelcomeHeader({ pastorName }: WelcomeHeaderProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  return (
    <div>
      <h1 className="text-sm font-bold sm:text-3xl">
        Welcome back, Pastor {pastorName}!
      </h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        Here&apos;s what&apos;s happening in your branches today.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
    </div>
  );
}
