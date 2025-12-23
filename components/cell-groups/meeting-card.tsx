"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, BookOpen, Users, MoreHorizontal, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const statusVariants: Record<MeetingStatus, "default" | "secondary" | "outline"> = {
  HELD: "default",
  SCHEDULED: "secondary",
  CANCELLED: "outline",
};

const statusLabels: Record<MeetingStatus, string> = {
  HELD: "Held",
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
  const formattedDate = format(meetingDate, "EEEE, MMMM d, yyyy");
  const shortDate = format(meetingDate, "MMM d");

  const hasAttendance = meeting.presentCount !== undefined && meeting.totalCount !== undefined;
  const attendanceText = hasAttendance
    ? `${meeting.presentCount}/${meeting.totalCount} present`
    : null;

  const showVisitors = meeting.visitorCount && meeting.visitorCount > 0;

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Date and Status */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium">{formattedDate}</span>
              <Badge variant={statusVariants[meeting.status]}>
                {statusLabels[meeting.status]}
              </Badge>
              {meeting.finalizedAt && (
                <Badge variant="outline" className="text-xs">
                  Finalized
                </Badge>
              )}
            </div>

            {/* Topic */}
            {meeting.topic && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="truncate">{meeting.topic}</span>
              </p>
            )}

            {/* Scripture Reference */}
            {meeting.scriptureReference && (
              <p className="text-xs text-muted-foreground mb-1">
                {meeting.scriptureReference}
              </p>
            )}

            {/* Time and Attendance Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              {meeting.startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {meeting.startTime}
                  {meeting.endTime && ` - ${meeting.endTime}`}
                </span>
              )}

              {attendanceText && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {attendanceText}
                </span>
              )}

              {showVisitors && meeting.visitorCount && (
                <span className="flex items-center gap-1 text-green-600">
                  +{meeting.visitorCount} visitor{meeting.visitorCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild size="sm" variant="outline">
          <Link href={`/${churchSlug}/${basePathPrefix}/cell-groups/${groupId}/meetings/${meeting.id}`}>
            Open
          </Link>
        </Button>

            {meeting.status !== "CANCELLED" && (onEdit || onCancel) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
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
      </CardContent>
    </Card>
  );
}
