"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { BookOpen, Users, MoreHorizontal, Pencil, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { MeetingStatus } from "@/types/cell-group";

interface MeetingCardProps {
  meeting: {
    id: string;
    meetingDate: string;
    status: MeetingStatus;
    topic: string | null;
    scriptureReference: string | null;
    startTime: string | null;
    endTime: string | null;
    notes: string | null;
    finalizedAt: string | null;
    presentCount?: number;
    totalCount?: number;
    visitorCount?: number;
  };
  groupId: string;
  churchSlug: string;
  basePathPrefix?: "admin" | "pastor";
  onEdit?: (meetingId: string) => void;
  onCancel?: (meetingId: string) => void;
}

const statusStyle: Record<MeetingStatus, string> = {
  HELD:      "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-muted text-muted-foreground",
};

const statusLabel: Record<MeetingStatus, string> = {
  HELD:      "Held",
  SCHEDULED: "Scheduled",
  CANCELLED: "Cancelled",
};

export function MeetingCard({
  meeting,
  groupId,
  churchSlug,
  basePathPrefix = "admin",
  onEdit,
  onCancel,
}: MeetingCardProps) {
  const meetingDate = parseISO(meeting.meetingDate);
  const shortDate = format(meetingDate, "d MMM yyyy");

  const hasAttendance = meeting.presentCount !== undefined && meeting.totalCount !== undefined;
  const showVisitors = (meeting.visitorCount ?? 0) > 0;

  return (
    <div className="rounded-md border bg-background p-3 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Date + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">{shortDate}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusStyle[meeting.status]}`}>
              {statusLabel[meeting.status]}
            </span>
            {meeting.finalizedAt && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                Finalized
              </span>
            )}
          </div>

          {/* Topic */}
          {meeting.topic && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
              <BookOpen className="h-3 w-3 shrink-0" />
              <span className="truncate">{meeting.topic}</span>
            </p>
          )}

          {/* Attendance + visitors */}
          {hasAttendance && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3 shrink-0" />
              {meeting.presentCount}/{meeting.totalCount} present
              {showVisitors && (
                <span className="text-emerald-600 ml-1">+{meeting.visitorCount} visitors</span>
              )}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
            <Link href={`/${churchSlug}/${basePathPrefix}/cell-groups/${groupId}/meetings/${meeting.id}`}>
              Open
            </Link>
          </Button>

          {meeting.status !== "CANCELLED" && (onEdit || onCancel) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(meeting.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Meeting
                  </DropdownMenuItem>
                )}
                {onCancel && meeting.status === "SCHEDULED" && (
                  <DropdownMenuItem
                    onClick={() => onCancel(meeting.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Meeting
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
