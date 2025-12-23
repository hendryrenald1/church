import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeetingList } from "@/components/cell-groups/meeting-list";

type GroupRow = {
  id: string;
  name: string;
  status: string;
  schedule_weekday: number | null;
  default_meeting_time: string | null;
  branch_id: string | null;
};

export default async function PastorGroupMeetingsPage({
  params,
}: {
  params: { churchSlug: string; groupId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  // Validate pastor profile and branches
  const { data: profileData } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (!profileData) notFound();

  const { data: branchAssignments } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id)")
    .eq("pastor_profile_id", profileData.id);
  const branchIds = (branchAssignments ?? [])
    .map((b: any) => b.branch?.id)
    .filter(Boolean) as string[];

  const [{ data: groupData, error: groupError }, { data: meetingsData }] = await Promise.all([
    supabase
      .from("cell_group")
      .select("id, name, status, schedule_weekday, default_meeting_time, branch_id")
      .eq("church_id", session.churchId)
      .eq("id", params.groupId)
      .maybeSingle(),
    supabase
      .from("cell_meeting")
      .select("id, meeting_date, status, finalized_at, visitor_count")
      .eq("church_id", session.churchId)
      .eq("group_id", params.groupId)
      .order("meeting_date", { ascending: false }),
  ]);

  if (groupError || !groupData) notFound();
  const group = groupData as unknown as GroupRow;
  if (group.branch_id && !branchIds.includes(group.branch_id)) {
    notFound();
  }

  const churchId = session.churchId!;

  const meetingsWithCounts = await Promise.all(
    (meetingsData ?? []).map(async (meeting: any) => {
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

  const basePath = `/${params.churchSlug}/pastor/cell-groups`;

  return (
    <div className="space-y-6 px-4 pb-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={basePath} className="underline-offset-4 hover:underline">
              Cell Groups
            </Link>{" "}
            /{" "}
            <Link href={`${basePath}/${params.groupId}`} className="underline-offset-4 hover:underline">
              {group.name}
            </Link>{" "}
            / Meetings
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">All Meetings</h1>
            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>{group.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {meetingsWithCounts.length} meeting{meetingsWithCounts.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`${basePath}/${params.groupId}`}>Back to Group</Link>
        </Button>
      </div>

      <MeetingList
        cellGroup={{ id: group.id, name: group.name, scheduleWeekday: group.schedule_weekday }}
        meetings={meetingsWithCounts}
        churchSlug={params.churchSlug}
        groupId={params.groupId}
        basePathPrefix="pastor"
        showCreateButton={false}
      />
    </div>
  );
}
