import Link from "next/link";
import { Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  icon: LucideIcon;
  iconBg: string;
  href?: string;
}

interface RecentActivityProps {
  activities: RecentActivityItem[];
  viewAllHref?: string;
}

export function RecentActivity({ activities, viewAllHref }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          {viewAllHref ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={viewAllHref}>View All</Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-6 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No recent activity yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`${activity.iconBg} rounded-full p-2 text-white`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {index !== activities.length - 1 ? (
                      <div className="mt-2 h-full w-px bg-border" />
                    ) : null}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activity.timeAgo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
