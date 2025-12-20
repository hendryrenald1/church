import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UpcomingEvent {
  id: string;
  dayOfWeek: string;
  dateDisplay: string;
  type: string;
  title: string;
  description: string;
  badgeClassName: string;
  icon?: LucideIcon;
  href?: string;
}

interface UpcomingEventsWidgetProps {
  events: UpcomingEvent[];
  viewCalendarHref?: string;
}

export function UpcomingEventsWidget({ events, viewCalendarHref }: UpcomingEventsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No upcoming events this week</p>
          ) : (
            events.map((event) => (
              <Link
                key={event.id}
                href={event.href ?? "#"}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
              >
                <div className="min-w-[48px] text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{event.dayOfWeek}</p>
                  <p className="text-2xl font-bold">{event.dateDisplay}</p>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={event.badgeClassName}>
                      {event.icon ? <event.icon className="mr-1 h-3.5 w-3.5" /> : null}
                      {event.type}
                    </Badge>
                    <p className="text-sm font-medium">{event.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
