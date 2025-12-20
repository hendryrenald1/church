import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, Edit, Send, UserMinus, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FamilyActivity } from "../page";

export function FamilyTimelineCard({ activities }: { activities: FamilyActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 text-white ${iconMap[activity.type]?.bg ?? "bg-gray-500"}`}>
                    {iconMap[activity.type]?.icon ?? <Activity className="h-3 w-3" />}
                  </div>
                  {index !== activities.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const iconMap: Record<
  FamilyActivity["type"],
  {
    icon: ReactNode;
    bg: string;
  }
> = {
  member_added: { icon: <UserPlus className="h-3 w-3" />, bg: "bg-green-500" },
  member_removed: { icon: <UserMinus className="h-3 w-3" />, bg: "bg-red-500" },
  family_updated: { icon: <Edit className="h-3 w-3" />, bg: "bg-blue-500" },
  message_sent: { icon: <Send className="h-3 w-3" />, bg: "bg-purple-500" },
  note: { icon: <Activity className="h-3 w-3" />, bg: "bg-gray-500" }
};
