import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, Edit, Send, UserMinus, UserPlus } from "lucide-react";
import type { FamilyActivity } from "../page";

export function FamilyTimelineCard({ activities }: { activities: FamilyActivity[] }) {
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          No recent activity
        </div>
      ) : (
        <div className="px-5 py-3 space-y-4">
          {activities.map((activity, index) => {
            const meta = iconMap[activity.type];
            return (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-1.5 text-white shrink-0 ${meta?.bg ?? "bg-muted-foreground"}`}>
                    {meta?.icon ?? <Activity className="h-3 w-3" />}
                  </div>
                  {index !== activities.length - 1 && (
                    <div className="mt-1 h-full w-px bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-3 min-w-0">
                  <p className="text-sm font-medium leading-tight">{activity.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const iconMap: Record<FamilyActivity["type"], { icon: ReactNode; bg: string }> = {
  member_added:   { icon: <UserPlus className="h-3 w-3" />,  bg: "bg-emerald-500" },
  member_removed: { icon: <UserMinus className="h-3 w-3" />, bg: "bg-red-500"     },
  family_updated: { icon: <Edit className="h-3 w-3" />,      bg: "bg-blue-500"    },
  message_sent:   { icon: <Send className="h-3 w-3" />,      bg: "bg-violet-500"  },
  note:           { icon: <Activity className="h-3 w-3" />,  bg: "bg-muted-foreground" },
};
