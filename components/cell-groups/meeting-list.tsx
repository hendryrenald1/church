"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "./meeting-card";
import { MeetingFormDialog } from "./meeting-form-dialog";
import type { MeetingStatus } from "@/types/cell-group";

interface Meeting {
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
}

interface CellGroup {
  id: string;
  name: string;
  scheduleWeekday: number | null;
}

interface MeetingListProps {
  cellGroup: CellGroup;
  meetings: Meeting[];
  churchSlug: string;
  groupId: string;
  basePathPrefix?: "admin" | "pastor";
  showCreateButton?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
}

export function MeetingList({
  cellGroup,
  meetings,
  churchSlug,
  groupId,
  basePathPrefix = "admin",
  showCreateButton = true,
  maxItems,
  showViewAll = false,
}: MeetingListProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  const displayedMeetings = maxItems ? meetings.slice(0, maxItems) : meetings;
  const hasMoreMeetings = maxItems && meetings.length > maxItems;

  const handleSuccess = () => {
    router.refresh();
  };

  const handleEdit = (meetingId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (meeting) {
      setEditingMeeting(meeting);
    }
  };

  const handleCancel = async (meetingId: string) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;

    try {
      const res = await fetch(`/api/admin/cell-groups/${groupId}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        throw new Error("Failed to cancel meeting");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to cancel meeting:", error);
      alert("Failed to cancel meeting. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      {showCreateButton && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Meetings</h3>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Meeting
          </Button>
        </div>
      )}

      {/* Meetings List */}
      {displayedMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h4 className="text-lg font-medium">No meetings yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first meeting to start tracking attendance.
          </p>
          {showCreateButton && (
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Meeting
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              groupId={groupId}
              churchSlug={churchSlug}
              basePathPrefix={basePathPrefix}
              onEdit={handleEdit}
              onCancel={handleCancel}
            />
          ))}

          {/* View All Link */}
          {showViewAll && hasMoreMeetings && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                onClick={() => router.push(`/${churchSlug}/${basePathPrefix}/cell-groups/${groupId}/meetings`)}
              >
                View all meetings ({meetings.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <MeetingFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        cellGroup={cellGroup}
        churchSlug={churchSlug}
        groupId={groupId}
        onSuccess={handleSuccess}
      />

      {/* Edit Dialog */}
      {editingMeeting && (
        <MeetingFormDialog
          open={!!editingMeeting}
          onOpenChange={(open) => !open && setEditingMeeting(null)}
          cellGroup={cellGroup}
          meeting={{
            id: editingMeeting.id,
            meetingDate: editingMeeting.meetingDate,
            topic: editingMeeting.topic,
            scriptureReference: editingMeeting.scriptureReference,
            startTime: editingMeeting.startTime,
            endTime: editingMeeting.endTime,
            notes: editingMeeting.notes,
            status: editingMeeting.status,
          }}
          churchSlug={churchSlug}
          groupId={groupId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
