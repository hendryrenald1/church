"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/cell-group";

interface Stats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unknown: number;
}

interface AttendanceStatsProps {
  stats: Stats;
  className?: string;
  /** @deprecated kept for API compatibility — no longer used */
  compact?: boolean;
}

export function AttendanceStats({ stats, className }: AttendanceStatsProps) {
  const marked = stats.total - stats.unknown;
  const rate =
    stats.total > 0
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0;

  return (
    <div className={cn("rounded-lg border bg-card shadow-sm overflow-hidden", className)}>
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0">
        {[
          { label: "Present",  value: stats.present,  cls: "text-emerald-700", bg: "bg-emerald-50/60" },
          { label: "Absent",   value: stats.absent,   cls: "text-red-700",     bg: "bg-red-50/60"     },
          { label: "Late",     value: stats.late,     cls: "text-amber-700",   bg: "bg-amber-50/60"   },
          { label: "Excused",  value: stats.excused,  cls: "text-blue-700",    bg: "bg-blue-50/60"    },
          { label: "Unmarked", value: stats.unknown,  cls: "text-muted-foreground", bg: ""            },
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={cn("flex flex-col items-center justify-center py-3 px-4", bg)}>
            <span className={cn("text-2xl font-bold leading-none", cls)}>{value}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3 border-t flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${rate}%` }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums shrink-0">{rate}%</span>
        <span className="text-xs text-muted-foreground shrink-0">{marked}/{stats.total} marked</span>
      </div>
    </div>
  );
}

export function calculateAttendanceStats(
  attendees: { status: AttendanceStatus }[]
): Stats {
  return {
    total:   attendees.length,
    present: attendees.filter((a) => a.status === "PRESENT").length,
    absent:  attendees.filter((a) => a.status === "ABSENT").length,
    late:    attendees.filter((a) => a.status === "LATE").length,
    excused: attendees.filter((a) => a.status === "EXCUSED").length,
    unknown: attendees.filter((a) => a.status === "UNKNOWN").length,
  };
}
