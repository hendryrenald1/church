// Cell Group Types for Meeting-Based Attendance System

// Meeting status enum
export type MeetingStatus = "SCHEDULED" | "HELD" | "CANCELLED";

// Attendance status enum
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "UNKNOWN";

// Cell Group Member Role
export type CellGroupMemberRole = "LEADER" | "ASSISTANT" | "MEMBER";

// Visitor follow-up status
export type FollowUpStatus = "PENDING" | "CONTACTED" | "CONVERTED" | "DECLINED";

// Cell Group type
export interface CellGroup {
  id: string;
  churchId: string;
  branchId: string | null;
  name: string;
  description: string | null;
  scheduleWeekday: number | null;
  defaultMeetingTime: string | null;
  status: "ACTIVE" | "INACTIVE";
  hostAddress: string | null;
  allowChildren: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined data
  branch?: {
    id: string;
    name: string;
  } | null;
  memberCount?: number;
}

// Cell Group Member type
export interface CellGroupMember {
  id: string;
  churchId: string;
  groupId: string;
  memberId: string;
  role: CellGroupMemberRole;
  joinedAt: string;
  archivedAt: string | null;
  // Joined member data
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
}

// Meeting type
export interface CellGroupMeeting {
  id: string;
  churchId: string;
  groupId: string;
  meetingDate: string; // ISO date string (YYYY-MM-DD)
  status: MeetingStatus;
  leaderMemberId: string | null;
  notes: string | null;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  finalizedAt: string | null;
  finalizedBy: string | null;
  combinedWithMeetingId: string | null;
  // Phase 2 fields
  topic: string | null;
  scriptureReference: string | null;
  startTime: string | null;
  endTime: string | null;
  offeringAmount: number;
  offeringNotes: string | null;
  cancelledReason: string | null;
  // Joined data
  cellGroup?: {
    id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
  };
  // Computed attendance stats
  attendanceStats?: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unknown: number;
  };
}

// Attendance record type
export interface MeetingAttendance {
  id: string;
  churchId: string;
  meetingId: string;
  memberId: string;
  status: AttendanceStatus;
  isChild: boolean;
  recordedBy: string | null;
  recordedAt: string | null;
  // Phase 2 fields
  isFirstTime: boolean;
  broughtVisitor: boolean;
  visitorCount: number;
  notes: string | null;
  // Joined member data
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
}

// Meeting with full attendance data
export interface MeetingWithAttendance extends CellGroupMeeting {
  attendance: MeetingAttendance[];
}

// Cell Group Visitor type
export interface CellGroupVisitor {
  id: string;
  churchId: string;
  meetingId: string;
  name: string;
  phone: string | null;
  email: string | null;
  invitedBy: string | null;
  followUpStatus: FollowUpStatus;
  followUpNotes: string | null;
  createdAt: string;
  // Joined data
  invitedByMember?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Form types for creating/editing meetings
export interface CreateMeetingInput {
  cellGroupId: string;
  meetingDate: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  scriptureReference?: string;
  notes?: string;
  status?: MeetingStatus;
}

export interface UpdateMeetingInput {
  meetingDate?: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  scriptureReference?: string;
  notes?: string;
  status?: MeetingStatus;
  offeringAmount?: number;
  offeringNotes?: string;
  cancelledReason?: string;
  visitorCount?: number;
}

// Form types for attendance
export interface UpdateAttendanceInput {
  meetingId: string;
  memberId: string;
  status: AttendanceStatus;
  isFirstTime?: boolean;
  broughtVisitor?: boolean;
  visitorCount?: number;
  notes?: string;
}

export interface BulkAttendanceInput {
  meetingId: string;
  status: AttendanceStatus;
  memberIds?: string[]; // If not provided, apply to all members
}

// Dashboard stats type
export interface CellGroupDashboardStats {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  meetingsThisWeek: number;
  attendanceThisWeek: {
    total: number;
    present: number;
    rate: number; // percentage
  };
  attendanceChange: number; // percentage change from last week
  newMembersThisMonth: number;
  groupsNeedingAttention: {
    groupId: string;
    groupName: string;
    issue: "no_recent_meeting" | "low_attendance" | "no_leader";
  }[];
}

// Attendee type for the attendance form (simplified view)
export interface Attendee {
  memberId: string;
  name: string;
  status: AttendanceStatus;
  role?: CellGroupMemberRole;
  isFirstTime?: boolean;
  broughtVisitor?: boolean;
  visitorCount?: number;
  notes?: string;
}

// Helper type for database row to frontend conversion
export type DbMeetingRow = {
  id: string;
  church_id: string;
  group_id: string;
  meeting_date: string;
  status: MeetingStatus;
  leader_member_id: string | null;
  notes: string | null;
  visitor_count: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  finalized_at: string | null;
  finalized_by: string | null;
  combined_with_meeting_id: string | null;
  topic: string | null;
  scripture_reference: string | null;
  start_time: string | null;
  end_time: string | null;
  offering_amount: number | null;
  offering_notes: string | null;
  cancelled_reason: string | null;
};

// Converter function type
export function dbMeetingToMeeting(row: DbMeetingRow): CellGroupMeeting {
  return {
    id: row.id,
    churchId: row.church_id,
    groupId: row.group_id,
    meetingDate: row.meeting_date,
    status: row.status,
    leaderMemberId: row.leader_member_id,
    notes: row.notes,
    visitorCount: row.visitor_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    finalizedAt: row.finalized_at,
    finalizedBy: row.finalized_by,
    combinedWithMeetingId: row.combined_with_meeting_id,
    topic: row.topic,
    scriptureReference: row.scripture_reference,
    startTime: row.start_time,
    endTime: row.end_time,
    offeringAmount: row.offering_amount ?? 0,
    offeringNotes: row.offering_notes,
    cancelledReason: row.cancelled_reason,
  };
}
