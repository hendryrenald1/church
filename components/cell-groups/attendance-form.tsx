"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Attendee = {
  memberId: string;
  name: string;
  status: "UNKNOWN" | "PRESENT" | "ABSENT";
};

export function AttendanceForm({
  churchSlug,
  groupId,
  meetingId,
  attendees
}: {
  churchSlug: string;
  groupId: string;
  meetingId: string;
  attendees: Attendee[];
}) {
  const [state, setState] = useState(attendees);
  const [isPending, startTransition] = useTransition();

  const updateStatus = (memberId: string, status: "UNKNOWN" | "PRESENT" | "ABSENT") => {
    setState((prev) => prev.map((a) => (a.memberId === memberId ? { ...a, status } : a)));
    startTransition(async () => {
      await fetch(`/api/admin/cell-groups/${groupId}/meetings/${meetingId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [{ memberId, status }] })
      });
    });
  };

  const bulkMark = (status: "PRESENT" | "ABSENT") => {
    const payload = state.map((a) => ({ memberId: a.memberId, status }));
    setState((prev) => prev.map((a) => ({ ...a, status })));
    startTransition(async () => {
      await fetch(`/api/admin/cell-groups/${groupId}/meetings/${meetingId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload })
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => bulkMark("PRESENT")} disabled={isPending}>
          Mark all present
        </Button>
        <Button size="sm" variant="outline" onClick={() => bulkMark("ABSENT")} disabled={isPending}>
          Mark all absent
        </Button>
      </div>

      <div className="divide-y rounded-md border">
        {state.map((attendee) => (
          <div key={attendee.memberId} className="flex items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="font-medium">{attendee.name}</p>
              <Badge variant="secondary" className="text-xs">
                {attendee.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {["PRESENT", "ABSENT", "UNKNOWN"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={attendee.status === status ? "default" : "outline"}
                  className={cn("w-24", attendee.status === status ? "" : "text-muted-foreground")}
                  onClick={() => updateStatus(attendee.memberId, status as any)}
                  disabled={isPending}
                >
                  {status === "PRESENT" ? "Present" : status === "ABSENT" ? "Absent" : "Reset"}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
