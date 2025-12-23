import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceForm } from "@/components/cell-groups/attendance-form";

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: "SCHEDULED" | "HELD" | "CANCELLED";
  finalized_at: string | null;
  visitor_count: number | null;
  group_id: string;
  cell_group: { id: string; name: string; status: string } | null;
};

type MemberRow = {
  id: string;
  member: { id: string; first_name: string; last_name: string };
};

export default async function PastorMeetingPage({
  params,
}: {
  params: { churchSlug: string; groupId: string; meetingId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  const [{ data: meetingData, error: meetingError }, { data: membersData }, { data: attendanceData }] =
    await Promise.all([
      supabase
        .from("cell_meeting")
        .select("id, meeting_date, status, finalized_at, visitor_count, group_id, cell_group:group_id (id, name, status)")
        .eq("church_id", session.churchId)
        .eq("id", params.meetingId)
        .maybeSingle(),
      supabase
        .from("cell_group_member")
        .select("id, member:member_id (id, first_name, last_name)")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .is("archived_at", null)
        .order("role"),
      supabase
        .from("meeting_attendance")
        .select("member_id, status")
        .eq("church_id", session.churchId)
        .eq("meeting_id", params.meetingId),
    ]);

  if (meetingError || !meetingData || meetingData.group_id !== params.groupId) {
    notFound();
  }

  const meeting = meetingData as unknown as MeetingRow;
  const members = (membersData ?? []) as unknown as MemberRow[];
  const attendanceMap = new Map<string, "UNKNOWN" | "PRESENT" | "ABSENT">();
  (attendanceData ?? []).forEach((row: any) => attendanceMap.set(row.member_id, row.status));

  const attendees = members.map((member) => ({
    memberId: member.member.id,
    name: `${member.member.first_name} ${member.member.last_name}`,
    status: attendanceMap.get(member.member.id) ?? "UNKNOWN",
  }));

  const basePath = `/${params.churchSlug}/pastor/cell-groups`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={basePath} className="underline-offset-4 hover:underline">
              Cell Groups
            </Link>{" "}
            /{" "}
            <Link href={`${basePath}/${params.groupId}`} className="underline-offset-4 hover:underline">
              {meeting.cell_group?.name ?? "Group"}
            </Link>{" "}
            / Meeting
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Meeting Attendance</h1>
            <Badge variant="secondary">{meeting.cell_group?.status ?? "Status"}</Badge>
            <Badge variant={meeting.finalized_at ? "default" : "outline"}>
              {meeting.status} {meeting.finalized_at ? "• Finalized" : ""}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Meeting date: {meeting.meeting_date}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`${basePath}/${params.groupId}`}>Back to group</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceForm
            churchSlug={params.churchSlug}
            groupId={params.groupId}
            meetingId={params.meetingId}
            attendees={attendees}
          />
        </CardContent>
      </Card>
    </div>
  );
}
