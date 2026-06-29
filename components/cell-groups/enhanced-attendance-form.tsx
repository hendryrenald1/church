"use client";

import { useState, useTransition, useCallback } from "react";
import { Check, X, RotateCcw, Lock, Users } from "lucide-react";
import { AttendanceMarker } from "./attendance-marker";
import { AttendanceStats, calculateAttendanceStats } from "./attendance-stats";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, CellGroupMemberRole } from "@/types/cell-group";

interface AttendeeData {
  memberId: string;
  name: string;
  status: AttendanceStatus;
  role?: CellGroupMemberRole;
  isFirstTime?: boolean;
  broughtVisitor?: boolean;
  visitorCount?: number;
  notes?: string;
}

interface EnhancedAttendanceFormProps {
  churchSlug: string;
  groupId: string;
  meetingId: string;
  attendees: AttendeeData[];
  meetingFinalized?: boolean;
}

export function EnhancedAttendanceForm({
  churchSlug,
  groupId,
  meetingId,
  attendees: initialAttendees,
  meetingFinalized = false,
}: EnhancedAttendanceFormProps) {
  const [attendees, setAttendees] = useState<AttendeeData[]>(initialAttendees);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const persistAttendance = useCallback(
    async (
      entries: {
        memberId: string;
        status: AttendanceStatus;
        isFirstTime?: boolean;
        broughtVisitor?: boolean;
        visitorCount?: number;
        notes?: string;
      }[]
    ) => {
      await fetch(
        `/api/admin/cell-groups/${groupId}/meetings/${meetingId}/attendance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        }
      );
      setSavedAt(new Date());
    },
    [groupId, meetingId]
  );

  const handleStatusChange = useCallback(
    (memberId: string, status: AttendanceStatus) => {
      setAttendees((prev) =>
        prev.map((a) => (a.memberId === memberId ? { ...a, status } : a))
      );
      startTransition(async () => {
        await persistAttendance([{ memberId, status }]);
      });
    },
    [persistAttendance]
  );

  const handleUpdateDetails = useCallback(
    (memberId: string, data: Partial<AttendeeData>) => {
      setAttendees((prev) =>
        prev.map((a) => (a.memberId === memberId ? { ...a, ...data } : a))
      );
      startTransition(async () => {
        const attendee = attendees.find((a) => a.memberId === memberId);
        if (attendee) {
          await persistAttendance([
            {
              memberId,
              status: attendee.status,
              isFirstTime: data.isFirstTime ?? attendee.isFirstTime,
              broughtVisitor: data.broughtVisitor ?? attendee.broughtVisitor,
              visitorCount: data.visitorCount ?? attendee.visitorCount,
              notes: data.notes ?? attendee.notes,
            },
          ]);
        }
      });
    },
    [attendees, persistAttendance]
  );

  const handleBulkMark = useCallback(
    (status: AttendanceStatus) => {
      const entries = attendees.map((a) => ({ memberId: a.memberId, status }));
      setAttendees((prev) => prev.map((a) => ({ ...a, status })));
      startTransition(async () => {
        await persistAttendance(entries);
      });
    },
    [attendees, persistAttendance]
  );

  const stats = calculateAttendanceStats(attendees);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats + progress bar */}
      <AttendanceStats stats={stats} />

      {/* Roster card */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Attendance Roster</span>
            <span className="text-xs text-muted-foreground">({attendees.length} members)</span>
          </div>

          {/* Bulk actions */}
          {!meetingFinalized && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleBulkMark("PRESENT")}
                disabled={isPending}
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <Check className="h-3 w-3" />All Present
              </button>
              <button
                onClick={() => handleBulkMark("ABSENT")}
                disabled={isPending}
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />All Absent
              </button>
              <button
                onClick={() => handleBulkMark("UNKNOWN")}
                disabled={isPending}
                className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium rounded-md border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />Reset
              </button>
            </div>
          )}
        </div>

        {/* Status key legend */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/20 border-b text-[11px] text-muted-foreground">
          <span>Keys:</span>
          {[
            { short: "P", label: "Present",  cls: "bg-emerald-600" },
            { short: "A", label: "Absent",   cls: "bg-red-600"     },
            { short: "L", label: "Late",     cls: "bg-amber-500"   },
            { short: "E", label: "Excused",  cls: "bg-blue-600"    },
          ].map(({ short, label, cls }) => (
            <span key={short} className="flex items-center gap-1">
              <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded text-white text-[10px] font-bold", cls)}>
                {short}
              </span>
              {label}
            </span>
          ))}
          {isPending && (
            <span className="ml-auto text-primary animate-pulse text-[11px]">Saving…</span>
          )}
          {!isPending && savedAt && (
            <span className="ml-auto text-emerald-600 text-[11px]">
              Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Rows */}
        {attendees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No members in this group yet.</p>
          </div>
        ) : (
          <div>
            {attendees.map((a) => (
              <AttendanceMarker
                key={a.memberId}
                attendee={a}
                onStatusChange={handleStatusChange}
                onUpdateDetails={handleUpdateDetails}
                disabled={isPending || meetingFinalized}
              />
            ))}
          </div>
        )}
      </div>

      {/* Finalized banner */}
      {meetingFinalized && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="h-4 w-4 shrink-0" />
          This meeting has been finalized. Attendance records are locked.
        </div>
      )}
    </div>
  );
}
