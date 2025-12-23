import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeetingList } from "@/components/cell-groups/meeting-list";

type GroupRow = {
  id: string;
  name: string;
  status: string;
  schedule_weekday: number | null;
  default_meeting_time: string | null;
};

export default async function CellGroupMeetingsPage({
  params,
}: {
  params: { churchSlug: string; groupId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  const [{ data: groupData, error: groupError }, { data: meetingsData }] = await Promise.all([
    supabase
      .from("cell_group")
      .select("id, name, status, schedule_weekday, default_meeting_time")
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

  if (groupError || !groupData) {
    notFound();
  }

  const group = groupData as unknown as GroupRow;
  const churchId = session.churchId!; // Already validated above

  // Fetch attendance counts for each meeting
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
        ...meeting,
        meetingDate: meeting.meeting_date,
        scriptureReference: null,
        startTime: null,
        endTime: null,
        finalizedAt: meeting.finalized_at,
        visitorCount: meeting.visitor_count ?? 0,
        totalCount,
        presentCount,
      };
    })
  );

  const basePath = `/${params.churchSlug}/admin/cell-groups`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              {group.name}
            </Link>{" "}
            / Meetings
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">All Meetings</h1>
            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>
              {group.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {meetingsWithCounts.length} meeting{meetingsWithCounts.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`${basePath}/${params.groupId}`}>Back to Group</Link>
        </Button>
      </div>

      {/* Meeting List */}
      <MeetingList
        cellGroup={{
          id: group.id,
          name: group.name,
          scheduleWeekday: group.schedule_weekday,
        }}
        meetings={meetingsWithCounts}
        churchSlug={params.churchSlug}
        groupId={params.groupId}
        showCreateButton={true}
      />
    </div>
  );
}
