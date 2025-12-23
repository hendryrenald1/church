"use client";

import { useState, useTransition } from "react";
import { format, addDays, subDays, nextDay, previousDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/types/cell-group";

interface CellGroup {
  id: string;
  name: string;
  scheduleWeekday: number | null;
}

interface Meeting {
  id: string;
  meetingDate: string;
  topic: string | null;
  scriptureReference: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  status: MeetingStatus;
}

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellGroup: CellGroup;
  meeting?: Meeting; // If provided, edit mode
  onSuccess: () => void;
  churchSlug: string;
  groupId: string;
}

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function MeetingFormDialog({
  open,
  onOpenChange,
  cellGroup,
  meeting,
  onSuccess,
  churchSlug,
  groupId,
}: MeetingFormDialogProps) {
  const isEditing = !!meeting;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    meeting ? new Date(meeting.meetingDate + "T00:00:00") : undefined
  );
  const [topic, setTopic] = useState(meeting?.topic ?? "");
  const [scriptureReference, setScriptureReference] = useState(meeting?.scriptureReference ?? "");
  const [startTime, setStartTime] = useState(meeting?.startTime ?? "");
  const [endTime, setEndTime] = useState(meeting?.endTime ?? "");
  const [notes, setNotes] = useState(meeting?.notes ?? "");

  // Calculate quick-select dates based on group's schedule
  const getQuickDates = () => {
    const today = new Date();
    const dates: { label: string; date: Date }[] = [];

    if (cellGroup.scheduleWeekday !== null) {
      const dayName = weekdayNames[cellGroup.scheduleWeekday];

      // Next occurrence of the scheduled day
      const nextMeetingDay = nextDay(today, cellGroup.scheduleWeekday as 0 | 1 | 2 | 3 | 4 | 5 | 6);
      // If today is the meeting day, use today
      const thisWeek = today.getDay() === cellGroup.scheduleWeekday ? today : nextMeetingDay;

      // Previous occurrence
      const lastMeetingDay = previousDay(today, cellGroup.scheduleWeekday as 0 | 1 | 2 | 3 | 4 | 5 | 6);
      const lastWeek = today.getDay() === cellGroup.scheduleWeekday ? subDays(today, 7) : lastMeetingDay;

      dates.push({ label: `This ${dayName}`, date: thisWeek });
      dates.push({ label: `Last ${dayName}`, date: lastWeek });
    }

    // Always add today option
    if (!dates.some(d => format(d.date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))) {
      dates.unshift({ label: "Today", date: today });
    }

    return dates;
  };

  const quickDates = getQuickDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError("Please select a meeting date");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          meetingDate: format(selectedDate, "yyyy-MM-dd"),
          topic: topic || null,
          scriptureReference: scriptureReference || null,
          startTime: startTime || null,
          endTime: endTime || null,
          notes: notes || null,
          status: "HELD" as MeetingStatus,
        };

        const url = isEditing
          ? `/api/admin/cell-groups/${groupId}/meetings/${meeting.id}`
          : `/api/admin/cell-groups/${groupId}/meetings`;

        const res = await fetch(url, {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save meeting");
        }

        onSuccess();
        onOpenChange(false);
        // Reset form
        setSelectedDate(undefined);
        setTopic("");
        setScriptureReference("");
        setStartTime("");
        setEndTime("");
        setNotes("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Meeting" : "Create Meeting"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the meeting details below."
              : `Create a new meeting for ${cellGroup.name}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Meeting Date *</Label>

            {/* Quick date buttons */}
            {!isEditing && quickDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {quickDates.map((qd) => (
                  <Button
                    key={qd.label}
                    type="button"
                    size="sm"
                    variant={
                      selectedDate && format(selectedDate, "yyyy-MM-dd") === format(qd.date, "yyyy-MM-dd")
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setSelectedDate(qd.date)}
                  >
                    {qd.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Calendar picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g., 19:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g., 21:00"
              />
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Parable of the Sower"
            />
          </div>

          {/* Scripture Reference */}
          <div className="space-y-2">
            <Label htmlFor="scriptureReference">Scripture Reference</Label>
            <Input
              id="scriptureReference"
              value={scriptureReference}
              onChange={(e) => setScriptureReference(e.target.value)}
              placeholder="e.g., Matthew 13:1-23"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meeting notes or discussion points..."
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
