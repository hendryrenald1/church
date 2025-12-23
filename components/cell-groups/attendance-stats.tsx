"use client";

import { Users, Check, X, Clock, MessageSquare, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/cell-group";

interface AttendanceStatsProps {
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unknown: number;
  };
  className?: string;
  compact?: boolean;
}

interface StatItemProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  compact?: boolean;
}

function StatItem({ label, count, icon, colorClass, compact }: StatItemProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm", colorClass)}>
        {icon}
        <span className="font-medium">{count}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
      <div className={cn("flex items-center gap-1.5 mb-1", colorClass)}>
        {icon}
        <span className="text-2xl font-semibold">{count}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function AttendanceStats({ stats, className, compact = false }: AttendanceStatsProps) {
  const markedCount = stats.total - stats.unknown;
  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
        <span className="text-sm text-muted-foreground">
          {markedCount}/{stats.total} marked
        </span>
        <div className="flex flex-wrap gap-3">
          <StatItem
            label="Present"
            count={stats.present}
            icon={<Check className="h-3.5 w-3.5" />}
            colorClass="text-green-600"
            compact
          />
          <StatItem
            label="Absent"
            count={stats.absent}
            icon={<X className="h-3.5 w-3.5" />}
            colorClass="text-red-600"
            compact
          />
          {stats.late > 0 && (
            <StatItem
              label="Late"
              count={stats.late}
              icon={<Clock className="h-3.5 w-3.5" />}
              colorClass="text-yellow-600"
              compact
            />
          )}
          {stats.excused > 0 && (
            <StatItem
              label="Excused"
              count={stats.excused}
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              colorClass="text-blue-600"
              compact
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Attendance Summary
          </h4>
          <div className="text-right">
            <span className="text-2xl font-semibold">{attendanceRate}%</span>
            <p className="text-xs text-muted-foreground">attendance rate</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatItem
            label="Total"
            count={stats.total}
            icon={<Users className="h-4 w-4" />}
            colorClass="text-foreground"
          />
          <StatItem
            label="Present"
            count={stats.present}
            icon={<Check className="h-4 w-4" />}
            colorClass="text-green-600"
          />
          <StatItem
            label="Absent"
            count={stats.absent}
            icon={<X className="h-4 w-4" />}
            colorClass="text-red-600"
          />
          <StatItem
            label="Late"
            count={stats.late}
            icon={<Clock className="h-4 w-4" />}
            colorClass="text-yellow-600"
          />
          <StatItem
            label="Excused"
            count={stats.excused}
            icon={<MessageSquare className="h-4 w-4" />}
            colorClass="text-blue-600"
          />
        </div>

        {stats.unknown > 0 && (
          <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            {stats.unknown} member{stats.unknown !== 1 ? "s" : ""} not yet marked
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to calculate stats from attendee list
export function calculateAttendanceStats(
  attendees: { status: AttendanceStatus }[]
): AttendanceStatsProps["stats"] {
  return {
    total: attendees.length,
    present: attendees.filter((a) => a.status === "PRESENT").length,
    absent: attendees.filter((a) => a.status === "ABSENT").length,
    late: attendees.filter((a) => a.status === "LATE").length,
    excused: attendees.filter((a) => a.status === "EXCUSED").length,
    unknown: attendees.filter((a) => a.status === "UNKNOWN").length,
  };
}
