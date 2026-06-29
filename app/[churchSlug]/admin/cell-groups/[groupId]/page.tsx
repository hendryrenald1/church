import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MeetingList } from "@/components/cell-groups/meeting-list";
import { QuickAttendanceButton } from "@/components/cell-groups/quick-attendance-button";
import { AddMemberForm } from "@/components/cell-groups/add-member-form";
import type { MeetingStatus } from "@/types/cell-group";
import {
  Building2,
  Calendar,
  Clock,
  MoreHorizontal,
  UserCircle2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  schedule_weekday: number | null;
  default_meeting_time: string | null;
  branch: { id: string; name: string } | null;
};

type MemberRow = {
  id: string;
  role: "LEADER" | "ASSISTANT" | "MEMBER";
  member: { id: string; first_name: string; last_name: string; email: string | null };
};
type MemberOption = { id: string; name: string; email?: string | null };

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: MeetingStatus;
  finalized_at: string | null;
  visitor_count: number | null;
  topic: string | null;
  scripture_reference: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
};

const avatarColors = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-pink-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const roleBadgeStyle: Record<string, string> = {
  LEADER: "bg-primary/10 text-primary",
  ASSISTANT: "bg-amber-100 text-amber-700",
  MEMBER: "bg-muted text-muted-foreground",
};

const roleLabel: Record<string, string> = {
  LEADER: "Leader",
  ASSISTANT: "Assistant",
  MEMBER: "Member",
};

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function CellGroupDetailPage({ params }: { params: { churchSlug: string; groupId: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [{ data: groupData, error: groupError }, { data: membersData, error: membersError }, { data: meetingsData }] =
    await Promise.all([
      supabase
        .from("cell_group")
        .select("id, name, description, status, schedule_weekday, default_meeting_time, branch:branch_id (id, name)")
        .eq("church_id", session.churchId)
        .eq("id", params.groupId)
        .maybeSingle(),
      supabase
        .from("cell_group_member")
        .select("id, role, member:member_id (id, first_name, last_name, email)")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .is("archived_at", null),
      supabase
        .from("cell_meeting")
        .select("id, meeting_date, status, finalized_at, visitor_count, topic, scripture_reference, start_time, end_time, notes")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .order("meeting_date", { ascending: false })
        .limit(10),
    ]);

  if (groupError || membersError || !groupData) {
    console.error("Failed to load cell group", groupError ?? membersError);
    notFound();
  }

  const group = groupData as unknown as GroupRow;
  const members = (membersData ?? []) as unknown as MemberRow[];
  const meetingsRaw = (meetingsData ?? []) as MeetingRow[];
  const basePath = `/${params.churchSlug}/admin/cell-groups`;
  const churchId = session.churchId!;

  // Fetch attendance counts for each meeting
  const meetings = await Promise.all(
    meetingsRaw.map(async (meeting) => {
      const { data: attendanceDataRaw } = await supabase
        .from("meeting_attendance")
        .select("status")
        .eq("church_id", churchId)
        .eq("meeting_id", meeting.id);

      const attendanceData = attendanceDataRaw as { status: string }[] | null;
      const totalCount = attendanceData?.length ?? 0;
      const presentCount =
        attendanceData?.filter((a) => a.status === "PRESENT" || a.status === "LATE").length ?? 0;

      return {
        id: meeting.id,
        meetingDate: meeting.meeting_date,
        status: meeting.status,
        finalizedAt: meeting.finalized_at,
        visitorCount: meeting.visitor_count ?? 0,
        topic: meeting.topic,
        scriptureReference: meeting.scripture_reference,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        notes: meeting.notes,
        totalCount,
        presentCount,
      };
    })
  );

  const today = new Date().toISOString().slice(0, 10);
  const todaysMeeting = meetings.find((m) => m.meetingDate === today);

  const { data: memberOptionsDataRaw } = await supabase
    .from("member")
    .select("id, first_name, last_name, email")
    .eq("church_id", churchId)
    .order("first_name")
    .limit(500);
  const memberOptionsData = memberOptionsDataRaw as { id: string; first_name: string; last_name: string; email: string | null }[] | null;
  const memberOptions: MemberOption[] =
    memberOptionsData?.map((m) => ({ id: m.id, name: `${m.first_name} ${m.last_name}`, email: m.email })) ?? [];

  const isActive = group.status === "ACTIVE";
  const leader = members.find((m) => m.role === "LEADER");
  const scheduleLabel =
    group.schedule_weekday !== null
      ? `${weekdayNames[group.schedule_weekday]}${group.default_meeting_time ? ` at ${group.default_meeting_time}` : ""}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground transition-colors">
          Cell Groups
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{group.name}</span>
      </div>

      {/* Header Card */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 px-6 py-5">
          {/* Avatar */}
          <div
            className={`h-14 w-14 rounded-full ${getAvatarColor(group.name)} text-white flex items-center justify-center text-lg font-bold shrink-0`}
          >
            {getInitials(group.name)}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{group.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  isActive ? "text-emerald-700" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
              {group.branch && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {group.branch.name}
                  </span>
                </>
              )}
              {scheduleLabel && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {scheduleLabel}
                  </span>
                </>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1.5">{group.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <QuickAttendanceButton
              churchSlug={params.churchSlug}
              groupId={group.id}
              todaysMeetingId={todaysMeeting?.id}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`${basePath}/${group.id}/meetings`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    All Meetings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${basePath}/${group.id}/attendance`}>
                    <Clock className="h-4 w-4 mr-2" />
                    Attendance
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Members */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Members</span>
                <span className="text-xs text-muted-foreground font-normal">({members.length})</span>
              </div>
            </div>

            {/* Add member form */}
            <AddMemberForm groupId={params.groupId} memberOptions={memberOptions} />

            {/* Member list */}
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <UserCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No members yet. Add the first one above.</p>
              </div>
            ) : (
              <div className="divide-y">
                {members.map((m) => {
                  const fullName = `${m.member.first_name} ${m.member.last_name}`;
                  const initials = getInitials(fullName);
                  const color = getAvatarColor(fullName);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      {/* Avatar */}
                      <div
                        className={`h-8 w-8 rounded-full ${color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                      >
                        {initials}
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{fullName}</p>
                        {m.member.email && (
                          <p className="text-xs text-muted-foreground truncate">{m.member.email}</p>
                        )}
                      </div>

                      {/* Role badge */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeStyle[m.role] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {roleLabel[m.role] ?? m.role}
                      </span>

                      {/* View link */}
                      <Link
                        href={`/${params.churchSlug}/admin/members/${m.member.id}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: Meetings + Info */}
        <div className="space-y-6">
          {/* Meetings card */}
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Meetings</span>
              </div>
              {meetings.length > 5 && (
                <Link
                  href={`${basePath}/${group.id}/meetings`}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </Link>
              )}
            </div>
            <div className="p-3">
              <MeetingList
                cellGroup={{
                  id: group.id,
                  name: group.name,
                  scheduleWeekday: group.schedule_weekday,
                }}
                meetings={meetings.slice(0, 5)}
                churchSlug={params.churchSlug}
                groupId={group.id}
                showCreateButton={meetings.length === 0}
                maxItems={5}
                showViewAll={meetings.length > 5}
              />
            </div>
          </div>

          {/* Group Info card */}
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-muted/30">
              <span className="text-sm font-semibold">Group Info</span>
            </div>
            <div className="divide-y">
              {leader && (
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground">Leader</span>
                  <Link
                    href={`/${params.churchSlug}/admin/members/${leader.member.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {leader.member.first_name} {leader.member.last_name}
                  </Link>
                </div>
              )}
              {group.branch && (
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-medium">{group.branch.name}</span>
                </div>
              )}
              {scheduleLabel && (
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="font-medium">{scheduleLabel}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Meetings (last 10)</span>
                <span className="font-medium">{meetings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
