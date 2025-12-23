"use client";

import { useState } from "react";
import { Check, X, Clock, MessageSquare, ChevronDown, UserPlus, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

interface AttendanceMarkerProps {
  attendee: AttendeeData;
  onStatusChange: (memberId: string, status: AttendanceStatus) => void;
  onUpdateDetails: (memberId: string, data: Partial<AttendeeData>) => void;
  disabled?: boolean;
}

const statusConfig: Record<
  AttendanceStatus,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline"; icon?: React.ReactNode }
> = {
  PRESENT: { label: "Present", variant: "default", icon: <Check className="h-3 w-3" /> },
  ABSENT: { label: "Absent", variant: "destructive", icon: <X className="h-3 w-3" /> },
  LATE: { label: "Late", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  EXCUSED: { label: "Excused", variant: "outline", icon: <MessageSquare className="h-3 w-3" /> },
  UNKNOWN: { label: "Unknown", variant: "outline" },
};

export function AttendanceMarker({
  attendee,
  onStatusChange,
  onUpdateDetails,
  disabled = false,
}: AttendanceMarkerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentStatus = statusConfig[attendee.status];

  const handleStatusClick = (status: AttendanceStatus) => {
    onStatusChange(attendee.memberId, status);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 p-3">
        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{attendee.name}</p>
            {attendee.role && attendee.role !== "MEMBER" && (
              <Badge variant="outline" className="text-xs shrink-0">
                {attendee.role}
              </Badge>
            )}
          </div>
          {attendee.isFirstTime && (
            <p className="text-xs text-green-600">First time visitor</p>
          )}
          {attendee.broughtVisitor && (
            <p className="text-xs text-blue-600">
              Brought {attendee.visitorCount || 1} visitor{(attendee.visitorCount || 1) > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Status Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Main status buttons */}
          <Button
            size="sm"
            variant={attendee.status === "PRESENT" ? "default" : "outline"}
            className={cn("w-20", attendee.status !== "PRESENT" && "text-muted-foreground")}
            onClick={() => handleStatusClick("PRESENT")}
            disabled={disabled}
          >
            <Check className="mr-1 h-3 w-3" />
            Present
          </Button>

          <Button
            size="sm"
            variant={attendee.status === "ABSENT" ? "destructive" : "outline"}
            className={cn("w-20", attendee.status !== "ABSENT" && "text-muted-foreground")}
            onClick={() => handleStatusClick("ABSENT")}
            disabled={disabled}
          >
            <X className="mr-1 h-3 w-3" />
            Absent
          </Button>

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 px-2" disabled={disabled}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusClick("LATE")}>
                <Clock className="mr-2 h-4 w-4" />
                Mark as Late
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusClick("EXCUSED")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Mark as Excused
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusClick("UNKNOWN")}>
                Reset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Additional Options
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Current status badge */}
          <Badge variant={currentStatus.variant} className="ml-2 min-w-[70px] justify-center">
            {currentStatus.icon}
            <span className="ml-1">{currentStatus.label}</span>
          </Badge>
        </div>
      </div>

      {/* Expanded details section */}
      {isExpanded && (
        <div className="border-t px-3 py-3 space-y-3 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={attendee.isFirstTime || false}
                onCheckedChange={(checked) =>
                  onUpdateDetails(attendee.memberId, { isFirstTime: !!checked })
                }
                disabled={disabled}
              />
              First time visitor
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={attendee.broughtVisitor || false}
                onCheckedChange={(checked) =>
                  onUpdateDetails(attendee.memberId, {
                    broughtVisitor: !!checked,
                    visitorCount: checked ? 1 : 0,
                  })
                }
                disabled={disabled}
              />
              Brought a visitor
            </label>

            {attendee.broughtVisitor && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Count:</span>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  className="w-16 h-8"
                  value={attendee.visitorCount || 1}
                  onChange={(e) =>
                    onUpdateDetails(attendee.memberId, {
                      visitorCount: parseInt(e.target.value) || 1,
                    })
                  }
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Notes:</span>
            <Input
              placeholder="e.g., Shared testimony, Requested prayer"
              value={attendee.notes || ""}
              onChange={(e) => onUpdateDetails(attendee.memberId, { notes: e.target.value })}
              disabled={disabled}
              className="h-8"
            />
          </div>
        </div>
      )}
    </div>
  );
}
