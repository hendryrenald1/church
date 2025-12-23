import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAttendanceButton } from "@/components/cell-groups/quick-attendance-button";
import { MeetingList } from "@/components/cell-groups/meeting-list";

type GroupRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  schedule_weekday: number | null;
  default_meeting_time: string | null;
  branch_id: string | null;
  branch: { id: string; name: string } | null;
};

type MemberRow = {
  id: string;
  role: "LEADER" | "ASSISTANT" | "MEMBER";
  member: { id: string; first_name: string; last_name: string; email: string | null };
};

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: "SCHEDULED" | "HELD" | "CANCELLED";
  finalized_at: string | null;
  visitor_count: number | null;
};

export default async function PastorCellGroupDetailPage({
  params,
}: {
  params: { churchSlug: string; groupId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  // Get pastor branches
  const { data: profileData } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (!profileData) notFound();

  const { data: branchAssignments } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id, name)")
    .eq("pastor_profile_id", profileData.id);
  const branchIds = (branchAssignments ?? [])
    .map((b: any) => b.branch?.id)
    .filter(Boolean) as string[];

  const [{ data: groupData, error: groupError }, { data: membersData }, { data: meetingsData }] =
    await Promise.all([
      supabase
        .from("cell_group")
        .select("id, name, status, schedule_weekday, default_meeting_time, branch_id, branch:branch_id (id, name)")
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
        .select("id, meeting_date, status, finalized_at, visitor_count")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .order("meeting_date", { ascending: false }),
    ]);

  if (groupError || !groupData) notFound();
  const group = groupData as unknown as GroupRow;

  // Ensure group branch is within assigned branches (if group has branch)
  if (group.branch_id && !branchIds.includes(group.branch_id)) {
    notFound();
  }

  const members = (membersData ?? []) as unknown as MemberRow[];
  const meetingsRaw = (meetingsData ?? []) as MeetingRow[];
  const churchId = session.churchId!;
  const basePath = `/${params.churchSlug}/pastor/cell-groups`;

  // Fetch attendance counts for meetings
  const meetings = await Promise.all(
    meetingsRaw.map(async (meeting) => {
      const { data: attendanceDataRaw } = await supabase
        .from("meeting_attendance")
        .select("status")
        .eq("church_id", churchId)
        .eq("meeting_id", meeting.id);

      const attendanceData = attendanceDataRaw as { status: string }[] | null;
      const totalCount = attendanceData?.length ?? 0;
      const presentCount = attendanceData?.filter((a) => a.status === "PRESENT" || a.status === "LATE").length ?? 0;

      return {
        id: meeting.id,
        meetingDate: meeting.meeting_date,
        status: meeting.status,
        topic: null,
        scriptureReference: null,
        startTime: null,
        endTime: null,
        notes: null,
        finalizedAt: meeting.finalized_at,
        visitorCount: meeting.visitor_count ?? 0,
        totalCount,
        presentCount,
      };
    })
  );

  return (
    <div className="space-y-6 px-4 pb-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={basePath} className="underline-offset-4 hover:underline">
              Cell Groups
            </Link>{" "}
            / {group.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>{group.status}</Badge>
            <Badge variant="outline">{group.branch?.name ?? "Branch not set"}</Badge>
          </div>
        </div>
        <QuickAttendanceButton churchSlug={params.churchSlug} groupId={group.id} basePathPrefix="pastor" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {members.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No members yet.</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[2fr_1fr] sm:items-center">
                  <div>
                    <p className="font-medium">
                      {member.member.first_name} {member.member.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.member.email ?? "No email"}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingList
              cellGroup={{ id: group.id, name: group.name, scheduleWeekday: group.schedule_weekday }}
              meetings={meetings}
              churchSlug={params.churchSlug}
              groupId={group.id}
              basePathPrefix="pastor"
              showCreateButton={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
