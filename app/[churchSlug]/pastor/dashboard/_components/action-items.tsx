import Link from "next/link";
import {
  AlertCircle,
  Cake,
  ChevronRight,
  Heart,
  Phone,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ActionItemType =
  | "birthday"
  | "anniversary"
  | "inactive"
  | "missing_contact"
  | "followup"
  | "new_member"
  | "missed_attendance";

export type ActionItemPriority = "high" | "medium" | "low";

export interface ActionItem {
  id: string;
  type: ActionItemType;
  title: string;
  description: string;
  count?: number;
  priority: ActionItemPriority;
  actionLabel: string;
  actionHref: string;
}

const typeConfig: Record<
  ActionItemType,
  { icon: LucideIcon; color: string; bg: string }
> = {
  birthday: { icon: Cake, color: "text-pink-500", bg: "bg-pink-50" },
  anniversary: { icon: Heart, color: "text-red-500", bg: "bg-red-50" },
  inactive: { icon: UserX, color: "text-amber-500", bg: "bg-amber-50" },
  missing_contact: { icon: Phone, color: "text-blue-500", bg: "bg-blue-50" },
  followup: { icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
  new_member: { icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
  missed_attendance: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" }
};

const priorityStyles: Record<ActionItemPriority, string> = {
  high: "border-l-4 border-l-red-500 bg-red-50/50",
  medium: "border-l-4 border-l-amber-500 bg-amber-50/50",
  low: "border-l-4 border-l-blue-500 bg-blue-50/50"
};

interface ActionItemsProps {
  items: ActionItem[];
}

export function ActionItems({ items }: ActionItemsProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-emerald-500" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-emerald-50 p-3">
              <UserCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">All caught up!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No action items need your attention right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Action Items
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent/50",
                priorityStyles[item.priority]
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("rounded-full p-2", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Link href={item.actionHref}>
                <Button variant="ghost" size="sm" className="text-xs">
                  {item.actionLabel}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
