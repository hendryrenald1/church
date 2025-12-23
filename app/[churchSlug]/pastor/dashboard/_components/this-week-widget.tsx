import Link from "next/link";
import { Cake, Calendar, Heart, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type EventType = "cell_group" | "birthday" | "anniversary" | "visit" | "event";

export interface UpcomingEvent {
  id: string;
  dayOfWeek: string;
  dateDisplay: string;
  type: EventType;
  title: string;
  description: string;
  href?: string;
}

const eventTypeConfig: Record<
  EventType,
  { icon: LucideIcon; label: string; badgeClass: string }
> = {
  cell_group: {
    icon: Users,
    label: "Cell Group",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
  },
  birthday: {
    icon: Cake,
    label: "Birthday",
    badgeClass: "bg-pink-500/15 text-pink-600 dark:text-pink-300"
  },
  anniversary: {
    icon: Heart,
    label: "Anniversary",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-300"
  },
  visit: {
    icon: Calendar,
    label: "Visit",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-300"
  },
  event: {
    icon: Calendar,
    label: "Event",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300"
  }
};

interface ThisWeekWidgetProps {
  events: UpcomingEvent[];
  viewCalendarHref?: string;
}

export function ThisWeekWidget({ events, viewCalendarHref }: ThisWeekWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          This Week
        </CardTitle>
        {viewCalendarHref ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewCalendarHref}>View Calendar</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No upcoming events this week
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const config = eventTypeConfig[event.type];
              const Icon = config.icon;

              const content = (
                <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
                  <div className="min-w-[48px] text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {event.dayOfWeek}
                    </p>
                    <p className="text-2xl font-bold">{event.dateDisplay}</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={cn("text-xs", config.badgeClass)}>
                        <Icon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                      <p className="text-sm font-medium">{event.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              );

              if (event.href) {
                return (
                  <Link key={event.id} href={event.href}>
                    {content}
                  </Link>
                );
              }

              return <div key={event.id}>{content}</div>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
