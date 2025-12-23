import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedAttendanceForm } from "@/components/cell-groups/enhanced-attendance-form";
import { Calendar, Users } from "lucide-react";
import type { AttendanceStatus, CellGroupMemberRole } from "@/types/cell-group";

type MeetingStatus = "SCHEDULED" | "HELD" | "CANCELLED";

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: MeetingStatus;
  finalized_at: string | null;
  visitor_count: number | null;
  group_id: string;
  cell_group: { id: string; name: string; status: string; schedule_weekday: number | null } | null;
};

type MemberRow = {
  id: string;
  role: CellGroupMemberRole;
  member: { id: string; first_name: string; last_name: string };
};

const statusVariants: Record<MeetingStatus, "default" | "secondary" | "outline"> = {
  HELD: "default",
  SCHEDULED: "secondary",
  CANCELLED: "outline",
};

export default async function CellGroupMeetingPage({
  params,
}: {
  params: { churchSlug: string; groupId: string; meetingId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  const [{ data: meetingRaw, error: meetingError }, { data: membersData }, { data: attendanceData }] =
    await Promise.all([
      supabase
        .from("cell_meeting")
        .select(
          `id, meeting_date, status, finalized_at, visitor_count,
           group_id, cell_group:group_id (id, name, status, schedule_weekday)`
        )
        .eq("church_id", session.churchId)
        .eq("id", params.meetingId)
        .maybeSingle(),
      supabase
        .from("cell_group_member")
        .select("id, role, member:member_id (id, first_name, last_name)")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .is("archived_at", null)
        .order("role"),
      supabase
        .from("meeting_attendance")
        .select("member_id, status, is_first_time, brought_visitor, visitor_count, notes")
        .eq("church_id", session.churchId)
        .eq("meeting_id", params.meetingId),
    ]);

  const meeting = meetingRaw as MeetingRow | null;
  if (meetingError || !meeting || meeting.group_id !== params.groupId) {
    notFound();
  }

  const group = meeting.cell_group as { id: string; name: string; status: string; schedule_weekday: number | null };
  const meetingDate = parseISO(meeting.meeting_date);
  const formattedDate = format(meetingDate, "EEEE, MMMM d, yyyy");

  const members = (membersData ?? []) as unknown as MemberRow[];
  const attendanceMap = new Map<
    string,
    {
      status: AttendanceStatus;
      isFirstTime?: boolean;
      broughtVisitor?: boolean;
      visitorCount?: number;
      notes?: string;
    }
  >();

  (attendanceData ?? []).forEach((row: {
    member_id: string;
    status: AttendanceStatus;
    is_first_time?: boolean | null;
    brought_visitor?: boolean | null;
    visitor_count?: number | null;
    notes?: string | null;
  }) => {
    attendanceMap.set(row.member_id, {
      status: row.status,
      isFirstTime: row.is_first_time ?? undefined,
      broughtVisitor: row.brought_visitor ?? undefined,
      visitorCount: row.visitor_count ?? undefined,
      notes: row.notes ?? undefined,
    });
  });

  // Build attendees list with roles
  const attendees = members.map((member) => {
    const attendance = attendanceMap.get(member.member.id);
    return {
      memberId: member.member.id,
      name: `${member.member.first_name} ${member.member.last_name}`,
      status: (attendance?.status ?? "UNKNOWN") as AttendanceStatus,
      role: member.role,
      isFirstTime: attendance?.isFirstTime,
      broughtVisitor: attendance?.broughtVisitor,
      visitorCount: attendance?.visitorCount,
      notes: attendance?.notes,
    };
  });

  const basePath = `/${params.churchSlug}/admin/cell-groups`;
  const isCancelled = meeting.status === "CANCELLED";
  const isFinalized = !!meeting.finalized_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={basePath} className="underline-offset-4 hover:underline">
              Cell Groups
            </Link>{" "}
            /{" "}
            <Link
              href={`${basePath}/${params.groupId}`}
              className="underline-offset-4 hover:underline"
            >
              {group?.name ?? "Group"}
            </Link>{" "}
            /{" "}
            <Link
              href={`${basePath}/${params.groupId}/meetings`}
              className="underline-offset-4 hover:underline"
            >
              Meetings
            </Link>{" "}
            / {format(meetingDate, "MMM d, yyyy")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{formattedDate}</h1>
            <Badge variant={statusVariants[meeting.status as MeetingStatus]}>
              {meeting.status}
            </Badge>
            {isFinalized && (
              <Badge variant="outline" className="text-xs">
                Finalized
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`${basePath}/${params.groupId}`}>Back to Group</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Meeting Info */}
        <div className="space-y-6">
          {/* Meeting Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">Meeting Date</p>
                </div>
              </div>

              {/* Visitor Count */}
              {meeting.visitor_count && meeting.visitor_count > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {meeting.visitor_count} visitor{meeting.visitor_count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">External Visitors</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Right Column - Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {isCancelled ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">
                  This meeting was cancelled. Attendance cannot be recorded.
                </p>
              </div>
            ) : (
              <EnhancedAttendanceForm
                churchSlug={params.churchSlug}
                groupId={params.groupId}
                meetingId={params.meetingId}
                attendees={attendees}
                meetingFinalized={isFinalized}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
