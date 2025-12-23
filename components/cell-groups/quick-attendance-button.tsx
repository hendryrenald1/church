"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MeetingFormDialog } from "./meeting-form-dialog";

interface QuickAttendanceButtonProps {
  churchSlug: string;
  groupId: string;
  todaysMeetingId?: string;
  basePathPrefix?: "admin" | "pastor";
}

export function QuickAttendanceButton({
  churchSlug,
  groupId,
  todaysMeetingId,
  basePathPrefix = "admin",
}: QuickAttendanceButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const basePath = `/${churchSlug}/${basePathPrefix}/cell-groups/${groupId}`;

  // Start meeting for today (create meeting and navigate to it)
  const handleStartMeeting = async () => {
    startTransition(async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`/api/admin/cell-groups/${groupId}/meetings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingDate: today,
            status: "HELD",
          }),
        });

        if (res.ok) {
          const meeting = await res.json();
          router.push(`${basePath}/meetings/${meeting.id}`);
        } else if (res.status === 409) {
          // Meeting already exists for today, refresh and try again
          router.refresh();
        } else {
          console.error("Failed to create meeting");
        }
      } catch (error) {
        console.error("Failed to start meeting:", error);
      }
    });
  };

  const handleSuccess = () => {
    router.refresh();
    setIsCreateDialogOpen(false);
  };

  // If there's a meeting today, show "Take Attendance" button
  if (todaysMeetingId) {
    return (
      <div className="flex gap-2">
        <Button asChild>
          <a href={`${basePath}/meetings/${todaysMeetingId}`}>Take Attendance (Today)</a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Past Meeting
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`${basePath}/meetings`)}>
              <Calendar className="mr-2 h-4 w-4" />
              View All Meetings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <MeetingFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          cellGroup={{ id: groupId, name: "", scheduleWeekday: null }}
          churchSlug={churchSlug}
          groupId={groupId}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  // No meeting today - show "Start Meeting" button
  return (
    <div className="flex gap-2">
      <Button onClick={handleStartMeeting} disabled={isPending}>
        {isPending ? "Starting..." : "Start Meeting"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Past Meeting
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`${basePath}/meetings`)}>
            <Calendar className="mr-2 h-4 w-4" />
            View All Meetings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MeetingFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        cellGroup={{ id: groupId, name: "", scheduleWeekday: null }}
        churchSlug={churchSlug}
        groupId={groupId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
