"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarCheck,
  Flame,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendanceHistoryRecord } from "@/app/[churchSlug]/admin/members/[memberId]/attendance/page";

// ── Constants ─────────────────────────────────────────────────────────────────

type AttStatus = AttendanceHistoryRecord["status"];

const STATUS_META: Record<
  AttStatus,
  { label: string; bg: string; dot: string; Icon: React.ElementType }
> = {
  PRESENT: { label: "Present", bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", Icon: CheckCircle2 },
  LATE:    { label: "Late",    bg: "bg-amber-100 text-amber-700",     dot: "bg-amber-400",   Icon: Clock        },
  ABSENT:  { label: "Absent",  bg: "bg-red-100 text-red-700",         dot: "bg-red-500",     Icon: XCircle      },
  EXCUSED: { label: "Excused", bg: "bg-blue-100 text-blue-700",       dot: "bg-blue-400",    Icon: MinusCircle  },
  UNKNOWN: { label: "Unknown", bg: "bg-muted text-muted-foreground",  dot: "bg-gray-300",    Icon: MinusCircle  },
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + "T00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function weekdayName(d: string) {
  return new Date(d + "T00:00").toLocaleDateString("en-GB", { weekday: "long" });
}
const isAttended = (s: AttStatus) => s === "PRESENT" || s === "LATE";

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCell({
  icon: Icon, label, value, highlight,
}: {
  icon: React.ElementType; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-1">
      <Icon className="h-4 w-4 text-muted-foreground mb-0.5" />
      <span className={cn("text-xl font-bold leading-tight", highlight && "text-emerald-600")}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function MonthCalendar({
  year, month, records, selectedDate, onSelect,
}: {
  year: number;
  month: number;
  records: AttendanceHistoryRecord[];
  selectedDate: string | null;
  onSelect: (d: string | null) => void;
}) {
  const byDate = useMemo(() => {
    const m: Record<string, AttendanceHistoryRecord> = {};
    records.forEach((r) => { m[r.date] = r; });
    return m;
  }, [records]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const rec = byDate[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const meta = rec ? STATUS_META[rec.status] : null;

          return (
            <button
              key={i}
              onClick={() => rec && onSelect(isSelected ? null : dateStr)}
              className={cn(
                "relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-full text-sm font-medium transition-all",
                isSelected ? "bg-primary text-primary-foreground shadow" :
                isToday    ? "ring-2 ring-primary ring-offset-1" :
                rec        ? "hover:bg-muted cursor-pointer" :
                             "text-muted-foreground/40 cursor-default"
              )}
            >
              <span className="leading-none">{day}</span>
              {rec && !isSelected && (
                <span className={cn("absolute bottom-0.5 h-1.5 w-1.5 rounded-full", meta!.dot)} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecordRow({ rec }: { rec: AttendanceHistoryRecord }) {
  const meta = STATUS_META[rec.status];
  const Icon = meta.Icon;
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{rec.groupName}</p>
        <p className="text-xs text-muted-foreground">
          {rec.branch ?? "Cell Group"} · {weekdayName(rec.date)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", meta.bg)}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(rec.date)}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AttendanceHistoryClient({
  records,
  memberName,
}: {
  records: AttendanceHistoryRecord[];
  memberName: string;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Global stats ─────────────────────────────────────────────────────────────
  const attended = useMemo(() => records.filter((r) => isAttended(r.status)), [records]);
  const total = records.length;
  const rate = total > 0 ? Math.round((attended.length / total) * 100) : 0;

  const streak = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    let s = 0;
    for (const r of sorted) { if (isAttended(r.status)) s++; else break; }
    return s;
  }, [records]);

  // ── Month records ─────────────────────────────────────────────────────────────
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(monthPrefix)).sort((a, b) => b.date.localeCompare(a.date)),
    [records, monthPrefix]
  );
  const monthAttended = monthRecords.filter((r) => isAttended(r.status)).length;

  const displayRecords = selectedDate
    ? records.filter((r) => r.date === selectedDate)
    : monthRecords;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-4 divide-x">
          <StatCell icon={CalendarCheck} label="Total Attended" value={String(attended.length)} highlight />
          <StatCell icon={CheckCircle2}  label="Total Meetings" value={String(total)} />
          <StatCell icon={Flame}         label="Streak"         value={`${streak} wks`} />
          <StatCell icon={TrendingUp}    label="Rate"           value={`${rate}%`} highlight={rate >= 70} />
        </div>
        <div className="px-5 py-3 border-t flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{attended.length} of {total} meetings</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* Month navigator */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <button
            onClick={prevMonth}
            className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</p>
            <p className="text-xs text-muted-foreground">
              {monthAttended} of {monthRecords.length} attended
            </p>
          </div>
          <button
            onClick={nextMonth}
            className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="px-5 py-4">
          <MonthCalendar
            year={viewYear}
            month={viewMonth}
            records={monthRecords}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-3 border-t flex-wrap">
          {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as AttStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_META[s].dot)} />
              {STATUS_META[s].label}
            </span>
          ))}
          <span className="text-xs text-muted-foreground/60 ml-auto italic">Click a date to filter</span>
        </div>
      </div>

      {/* Meeting list */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">
              {selectedDate
                ? `${weekdayName(selectedDate)}, ${formatDate(selectedDate)}`
                : `${MONTH_NAMES[viewMonth]} Meetings`}
            </h2>
            <Badge variant="secondary" className="text-xs">{displayRecords.length}</Badge>
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Show month ×
            </button>
          )}
        </div>

        {displayRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <CalendarCheck className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No meetings for this period</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {selectedDate
                ? "No attendance recorded on this date."
                : "No meetings were recorded for this month."}
            </p>
          </div>
        ) : (
          <div>
            {displayRecords.map((rec) => (
              <RecordRow key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
