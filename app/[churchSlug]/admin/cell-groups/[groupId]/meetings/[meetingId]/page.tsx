import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { EnhancedAttendanceForm } from "@/components/cell-groups/enhanced-attendance-form";
import { ArrowLeft, BookOpen, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus, CellGroupMemberRole } from "@/types/cell-group";

type MeetingStatus = "SCHEDULED" | "HELD" | "CANCELLED";

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: MeetingStatus;
  finalized_at: string | null;
  visitor_count: number | null;
  topic: string | null;
  scripture_reference: string | null;
  start_time: string | null;
  group_id: string;
  cell_group: { id: string; name: string; schedule_weekday: number | null } | null;
};

type MemberRow = {
  id: string;
  role: CellGroupMemberRole;
  member: { id: string; first_name: string; last_name: string };
};

const meetingStatusStyle: Record<MeetingStatus, string> = {
  HELD:      "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-muted text-muted-foreground",
};

const weekdayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

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
          `id, meeting_date, status, finalized_at, visitor_count, topic, scripture_reference, start_time,
           group_id, cell_group:group_id (id, name, schedule_weekday)`
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
  if (meetingError || !meeting || meeting.group_id !== params.groupId) notFound();

  const group = meeting.cell_group as { id: string; name: string; schedule_weekday: number | null };
  const meetingDate = parseISO(meeting.meeting_date);
  const formattedDate = format(meetingDate, "EEEE, MMMM d, yyyy");
  const shortDate = format(meetingDate, "d MMM yyyy");

  const members = (membersData ?? []) as unknown as MemberRow[];
  const attendanceMap = new Map<
    string,
    { status: AttendanceStatus; isFirstTime?: boolean; broughtVisitor?: boolean; visitorCount?: number; notes?: string }
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

  const attendees = members.map((m) => {
    const att = attendanceMap.get(m.member.id);
    return {
      memberId: m.member.id,
      name: `${m.member.first_name} ${m.member.last_name}`,
      status: (att?.status ?? "UNKNOWN") as AttendanceStatus,
      role: m.role,
      isFirstTime: att?.isFirstTime,
      broughtVisitor: att?.broughtVisitor,
      visitorCount: att?.visitorCount,
      notes: att?.notes,
    };
  });

  const basePath = `/${params.churchSlug}/admin/cell-groups`;
  const isCancelled = meeting.status === "CANCELLED";
  const isFinalized = !!meeting.finalized_at;

  const scheduleLabel =
    group.schedule_weekday !== null ? weekdayNames[group.schedule_weekday] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground transition-colors">Cell Groups</Link>
        <span>/</span>
        <Link href={`${basePath}/${params.groupId}`} className="hover:text-foreground transition-colors">
          {group?.name ?? "Group"}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{shortDate}</span>
      </div>

      {/* Header card */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{formattedDate}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meetingStatusStyle[meeting.status]}`}>
                {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
              </span>
              {isFinalized && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                  Finalized
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />{group?.name}
              </span>
              {scheduleLabel && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />{scheduleLabel}
                    {meeting.start_time ? ` at ${meeting.start_time}` : ""}
                  </span>
                </>
              )}
              {meeting.topic && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[200px]">{meeting.topic}</span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`${basePath}/${params.groupId}`}>
                <ArrowLeft className="h-3.5 w-3.5" />Back
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance form */}
      {isCancelled ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">
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
    </div>
  );
}
