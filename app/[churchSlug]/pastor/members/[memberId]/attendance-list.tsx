"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  CalendarX,
  CheckCircle,
  Church,
  HandHeart,
  Users,
  type LucideIcon
} from "lucide-react";

type EventType = "sunday_service" | "midweek" | "prayer" | "group" | "event" | "default";

interface AttendanceEntry {
  id: string;
  eventName: string;
  eventType: EventType;
  date: string;
  checkInTime: string;
  branch?: string;
}

interface AttendanceListProps {
  entries: AttendanceEntry[];
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { weekday: "long" });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getEventTypeIcon(type: EventType): JSX.Element {
  const icons: Record<EventType, LucideIcon> = {
    sunday_service: Church,
    midweek: BookOpen,
    prayer: HandHeart,
    group: Users,
    event: Calendar,
    default: CheckCircle
  };
  const Icon = icons[type] ?? icons.default;
  return <Icon className="h-4 w-4" />;
}

function getEventTypeStyles(type: EventType): string {
  const styles: Record<EventType, string> = {
    sunday_service: "bg-blue-100 text-blue-700",
    midweek: "bg-purple-100 text-purple-700",
    prayer: "bg-amber-100 text-amber-700",
    group: "bg-green-100 text-green-700",
    event: "bg-pink-100 text-pink-700",
    default: "bg-gray-100 text-gray-700"
  };
  return styles[type] ?? styles.default;
}

type FilterType = "all" | "sunday_service" | "group" | "event";

export function AttendanceList({ entries }: AttendanceListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "sunday_service") return entry.eventType === "sunday_service";
    if (activeFilter === "group") return entry.eventType === "group";
    if (activeFilter === "event") return entry.eventType === "event" || entry.eventType === "midweek" || entry.eventType === "prayer";
    return true;
  });

  // Count entries per category for badge display
  const counts = {
    all: entries.length,
    sunday_service: entries.filter((e) => e.eventType === "sunday_service").length,
    group: entries.filter((e) => e.eventType === "group").length,
    event: entries.filter((e) => e.eventType === "event" || e.eventType === "midweek" || e.eventType === "prayer").length
  };

  return (
    <>
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">
            All {counts.all > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({counts.all})</span>}
          </TabsTrigger>
          <TabsTrigger value="sunday_service">
            Sunday Services {counts.sunday_service > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({counts.sunday_service})</span>}
          </TabsTrigger>
          <TabsTrigger value="group">
            Groups {counts.group > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({counts.group})</span>}
          </TabsTrigger>
          <TabsTrigger value="event">
            Events {counts.event > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({counts.event})</span>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <CalendarX className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {activeFilter === "all" ? "No attendance records yet" : `No ${activeFilter.replace("_", " ")} attendance records`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Check-ins will appear here when recorded.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${getEventTypeStyles(entry.eventType)}`}>
                  {getEventTypeIcon(entry.eventType)}
                </div>
                <div>
                  <p className="font-medium">{entry.eventName}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.branch ? `${entry.branch} • ` : ""}
                    {formatTime(entry.checkInTime)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatDate(entry.date)}</p>
                <p className="text-xs text-muted-foreground">{formatDay(entry.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
