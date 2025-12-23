"use client";

import { useState, useTransition, useCallback } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceMarker } from "./attendance-marker";
import { AttendanceStats, calculateAttendanceStats } from "./attendance-stats";
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

  // Persist attendance to server
  const persistAttendance = useCallback(
    async (entries: { memberId: string; status: AttendanceStatus; isFirstTime?: boolean; broughtVisitor?: boolean; visitorCount?: number; notes?: string }[]) => {
      await fetch(`/api/admin/cell-groups/${groupId}/meetings/${meetingId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
    },
    [groupId, meetingId]
  );

  // Handle status change for a single member
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

  // Handle additional details update
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

  // Bulk mark all members
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

  // Reset all attendance
  const handleResetAll = useCallback(() => {
    handleBulkMark("UNKNOWN");
  }, [handleBulkMark]);

  const stats = calculateAttendanceStats(attendees);

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <AttendanceStats stats={stats} compact />

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkMark("PRESENT")}
          disabled={isPending || meetingFinalized}
        >
          <Check className="mr-1.5 h-4 w-4" />
          Mark All Present
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkMark("ABSENT")}
          disabled={isPending || meetingFinalized}
        >
          <X className="mr-1.5 h-4 w-4" />
          Mark All Absent
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetAll}
          disabled={isPending || meetingFinalized}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Reset All
        </Button>
      </div>

      {/* Member List */}
      {attendees.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No members in this cell group yet.</p>
          <p className="text-sm">Add members to the group to mark attendance.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attendees.map((attendee) => (
            <AttendanceMarker
              key={attendee.memberId}
              attendee={attendee}
              onStatusChange={handleStatusChange}
              onUpdateDetails={handleUpdateDetails}
              disabled={isPending || meetingFinalized}
            />
          ))}
        </div>
      )}

      {/* Full Stats Card at Bottom */}
      {attendees.length > 0 && <AttendanceStats stats={stats} className="mt-6" />}

      {/* Finalized Warning */}
      {meetingFinalized && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          This meeting has been finalized. Attendance records are locked.
        </div>
      )}
    </div>
  );
}
