"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

const avatarColors = [
  "bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600",
  "bg-rose-600",  "bg-teal-600",   "bg-indigo-600", "bg-pink-600",
];
function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_OPTS: {
  value: AttendanceStatus;
  short: string;
  label: string;
  activeClass: string;
  hoverClass: string;
}[] = [
  {
    value: "PRESENT",
    short: "P", label: "Present",
    activeClass: "bg-emerald-600 text-white border-emerald-600",
    hoverClass:  "hover:border-emerald-400 hover:text-emerald-700",
  },
  {
    value: "ABSENT",
    short: "A", label: "Absent",
    activeClass: "bg-red-600 text-white border-red-600",
    hoverClass:  "hover:border-red-400 hover:text-red-700",
  },
  {
    value: "LATE",
    short: "L", label: "Late",
    activeClass: "bg-amber-500 text-white border-amber-500",
    hoverClass:  "hover:border-amber-400 hover:text-amber-700",
  },
  {
    value: "EXCUSED",
    short: "E", label: "Excused",
    activeClass: "bg-blue-600 text-white border-blue-600",
    hoverClass:  "hover:border-blue-400 hover:text-blue-700",
  },
];

const ROW_BG: Partial<Record<AttendanceStatus, string>> = {
  PRESENT: "bg-emerald-50/60",
  ABSENT:  "bg-red-50/60",
  LATE:    "bg-amber-50/60",
  EXCUSED: "bg-blue-50/60",
};

const ROLE_PILL: Partial<Record<CellGroupMemberRole, string>> = {
  LEADER:    "bg-primary/10 text-primary",
  ASSISTANT: "bg-amber-100 text-amber-700",
};

export function AttendanceMarker({
  attendee,
  onStatusChange,
  onUpdateDetails,
  disabled = false,
}: AttendanceMarkerProps) {
  const [expanded, setExpanded] = useState(false);

  const rowBg = ROW_BG[attendee.status] ?? "";

  const handleToggle = (status: AttendanceStatus) => {
    onStatusChange(
      attendee.memberId,
      attendee.status === status ? "UNKNOWN" : status
    );
  };

  return (
    <div className={cn("border-b last:border-b-0 transition-colors", rowBg)}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div
          className={cn(
            "h-8 w-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0",
            getAvatarColor(attendee.name)
          )}
        >
          {getInitials(attendee.name)}
        </div>

        {/* Name + role + sub-info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{attendee.name}</span>
            {attendee.role && attendee.role !== "MEMBER" && ROLE_PILL[attendee.role] && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                  ROLE_PILL[attendee.role]
                )}
              >
                {attendee.role.charAt(0) + attendee.role.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            {attendee.isFirstTime && (
              <span className="text-[10px] text-emerald-600 font-medium shrink-0">First time</span>
            )}
            {attendee.broughtVisitor && (
              <span className="text-[10px] text-blue-600 font-medium shrink-0">
                +{attendee.visitorCount || 1} visitor{(attendee.visitorCount || 1) > 1 ? "s" : ""}
              </span>
            )}
            {attendee.notes && !attendee.isFirstTime && !attendee.broughtVisitor && (
              <span className="text-[10px] text-muted-foreground truncate">{attendee.notes}</span>
            )}
          </div>
        </div>

        {/* P / A / L / E toggle buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              disabled={disabled}
              title={opt.label}
              className={cn(
                "h-7 w-7 rounded-md border text-xs font-bold transition-colors",
                attendee.status === opt.value
                  ? opt.activeClass
                  : cn("border-input text-muted-foreground", opt.hoverClass)
              )}
            >
              {opt.short}
            </button>
          ))}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="h-7 w-7 rounded-md border border-input flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
          title="More options"
        >
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 pt-0 space-y-2.5 bg-muted/30 border-t">
          <div className="flex flex-wrap items-center gap-4 pt-2.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <Checkbox
                checked={!!attendee.isFirstTime}
                onCheckedChange={(v) =>
                  onUpdateDetails(attendee.memberId, { isFirstTime: !!v })
                }
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
              First time visitor
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <Checkbox
                checked={!!attendee.broughtVisitor}
                onCheckedChange={(v) =>
                  onUpdateDetails(attendee.memberId, {
                    broughtVisitor: !!v,
                    visitorCount: v ? (attendee.visitorCount || 1) : 0,
                  })
                }
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
              Brought a visitor
            </label>

            {attendee.broughtVisitor && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Count:</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  className="w-14 h-6 text-xs px-2"
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
            <span className="text-xs text-muted-foreground shrink-0">Note:</span>
            <Input
              placeholder="e.g., Shared testimony, Requested prayer…"
              value={attendee.notes || ""}
              onChange={(e) =>
                onUpdateDetails(attendee.memberId, { notes: e.target.value })
              }
              disabled={disabled}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
